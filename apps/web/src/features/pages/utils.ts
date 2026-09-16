import type {
  WorkspaceWsMessage,
  WorkspaceId,
} from '@dotion/shared/workspaces/types'
import type { QueryClient } from '@tanstack/react-query'
import type {
  PageId,
  PageTreeNode,
  PageMemberPermission,
  PagePermissionRole,
  PageAccessRequestStatusResponse,
  TrashedPage,
} from './types'
import {
  pageDetailQueryOptions,
  pageTreeQueryOptions,
  trashedPagesQueryOptions,
  pageAccessRequestStatusQueryOptions,
  pagePermissionsInfiniteQueryOptions,
} from './query-options'

export function getDescendantNodeIds(
  nodes: PageTreeNode[],
  rootId: PageId,
): Set<PageId> {
  const descendantIds = new Set<PageId>([rootId])
  let added = true
  while (added) {
    added = false
    for (const node of nodes) {
      if (
        node.parentId &&
        descendantIds.has(node.parentId as PageId) &&
        !descendantIds.has(node.id)
      ) {
        descendantIds.add(node.id)
        added = true
      }
    }
  }
  return descendantIds
}

export function removePageAndDescendantsFromTree(
  oldTree: PageTreeNode[] | undefined,
  pageId: PageId,
  knownDescendantIds?: string[],
): PageTreeNode[] | undefined {
  if (!oldTree) return oldTree
  const idsToRemove =
    knownDescendantIds && knownDescendantIds.length > 0
      ? new Set([pageId, ...knownDescendantIds])
      : getDescendantNodeIds(oldTree, pageId)
  return oldTree.filter((node) => !idsToRemove.has(node.id))
}

export function addOrUpdatePageInTree(
  oldTree: PageTreeNode[] | undefined,
  node: PageTreeNode,
): PageTreeNode[] | undefined {
  if (!oldTree) return [node]
  const exists = oldTree.some((n) => n.id === node.id)
  if (exists) {
    return oldTree.map((n) => (n.id === node.id ? { ...n, ...node } : n))
  }
  return [...oldTree, node]
}

export function addPageToTrash(
  oldTrash: TrashedPage[] | undefined,
  trashed: TrashedPage,
): TrashedPage[] | undefined {
  if (!oldTrash) return [trashed]
  if (oldTrash.some((p) => p.id === trashed.id)) return oldTrash
  return [trashed, ...oldTrash]
}

export function removePageFromTrash(
  oldTrash: TrashedPage[] | undefined,
  pageId: PageId,
): TrashedPage[] | undefined {
  if (!oldTrash) return oldTrash
  return oldTrash.filter((p) => p.id !== pageId)
}

export const handlePageAddedWsMessage = (
  queryClient: QueryClient,
  payload: Extract<WorkspaceWsMessage, { type: 'page.created' }>['payload'],
) => {
  queryClient.setQueryData(
    pageTreeQueryOptions(payload.workspaceId).queryKey,
    (oldData) => addOrUpdatePageInTree(oldData, payload),
  )
}

export const handlePageMovedToTrashWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'page.moved_to_trash' }
  >['payload'],
) => {
  queryClient.setQueryData(
    pageTreeQueryOptions(payload.workspaceId).queryKey,
    (oldData) =>
      removePageAndDescendantsFromTree(
        oldData,
        payload.pageId,
        payload.pageIds,
      ),
  )

  const pageDetail = queryClient.getQueryData(
    pageDetailQueryOptions(payload.workspaceId, payload.pageId).queryKey,
  )
  queryClient.setQueryData(
    trashedPagesQueryOptions(payload.workspaceId).queryKey,
    (oldTrash) =>
      addPageToTrash(oldTrash, {
        id: payload.pageId,
        parentId: pageDetail?.parentId ?? null,
        title: pageDetail?.title ?? 'Untitled',
        icon: pageDetail?.icon ?? undefined,
        deletedAt: new Date().toISOString(),
        deletedByName: 'A member',
      }),
  )

  queryClient.setQueryData(
    pageDetailQueryOptions(payload.workspaceId, payload.pageId).queryKey,
    (old) => (old ? { ...old, inTrash: true } : old),
  )

  if (payload.pageIds) {
    for (const pid of payload.pageIds) {
      queryClient.setQueryData(
        pageDetailQueryOptions(payload.workspaceId, pid as PageId).queryKey,
        (old) => (old ? { ...old, inTrash: true } : old),
      )
    }
  }
}

export const handlePageRestoredWsMessage = (
  queryClient: QueryClient,
  payload: Extract<WorkspaceWsMessage, { type: 'page.restored' }>['payload'],
) => {
  queryClient.setQueryData(
    pageTreeQueryOptions(payload.workspaceId).queryKey,
    (oldData) =>
      addOrUpdatePageInTree(oldData, {
        id: payload.id,
        title: payload.title,
        icon: payload.icon,
        parentId: payload.parentId,
      }),
  )
  queryClient.setQueryData(
    trashedPagesQueryOptions(payload.workspaceId).queryKey,
    (oldTrash) => removePageFromTrash(oldTrash, payload.id),
  )
  queryClient.setQueryData(
    pageDetailQueryOptions(payload.workspaceId, payload.id).queryKey,
    (old) => (old ? { ...old, inTrash: false } : old),
  )
}

export const handlePageDeletedPermanentlyWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'page.deleted_permanently' }
  >['payload'],
) => {
  queryClient.setQueryData(
    pageTreeQueryOptions(payload.workspaceId).queryKey,
    (oldData) =>
      removePageAndDescendantsFromTree(
        oldData,
        payload.pageId,
        payload.pageIds,
      ),
  )
  queryClient.setQueryData(
    trashedPagesQueryOptions(payload.workspaceId).queryKey,
    (oldTrash) => removePageFromTrash(oldTrash, payload.pageId),
  )
  queryClient.removeQueries({
    queryKey: pageDetailQueryOptions(payload.workspaceId, payload.pageId)
      .queryKey,
  })
  if (payload.pageIds) {
    for (const pid of payload.pageIds) {
      queryClient.setQueryData(
        trashedPagesQueryOptions(payload.workspaceId).queryKey,
        (oldTrash) => removePageFromTrash(oldTrash, pid as PageId),
      )
      queryClient.removeQueries({
        queryKey: pageDetailQueryOptions(payload.workspaceId, pid as PageId)
          .queryKey,
      })
    }
  }
}

export const handleTrashEmptiedWsMessage = (
  queryClient: QueryClient,
  payload: Extract<WorkspaceWsMessage, { type: 'trash.emptied' }>['payload'],
) => {
  queryClient.setQueryData(
    trashedPagesQueryOptions(payload.workspaceId).queryKey,
    [],
  )
}

export const handleDocumentTitleChangedWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'document.title.changed' }
  >['payload'],
) => {
  queryClient.setQueryData(
    pageTreeQueryOptions(payload.workspaceId).queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return oldData.map((node) =>
        node.id === payload.id ? { ...node, title: payload.title } : node,
      )
    },
  )

  queryClient.setQueryData(
    pageDetailQueryOptions(payload.workspaceId, payload.id).queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return { ...oldData, title: payload.title }
    },
  )
}

export const handleDocumentIconChangedWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'document.icon.changed' }
  >['payload'],
) => {
  queryClient.setQueryData(
    pageTreeQueryOptions(payload.workspaceId).queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return oldData.map((node) =>
        node.id === payload.id ? { ...node, icon: payload.icon } : node,
      )
    },
  )

  queryClient.setQueryData(
    pageDetailQueryOptions(payload.workspaceId, payload.id).queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return { ...oldData, icon: payload.icon }
    },
  )
}

export const handleDocumentCoverChangedWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'document.cover.changed' }
  >['payload'],
) => {
  queryClient.setQueryData(
    pageDetailQueryOptions(payload.workspaceId, payload.id).queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return { ...oldData, cover: payload.cover }
    },
  )
}

export const updatePageAccessRequestStatusInCache = (
  queryClient: QueryClient,
  workspaceId: WorkspaceId,
  pageId: PageId,
  status: PageAccessRequestStatusResponse,
) => {
  queryClient.setQueryData(
    pageAccessRequestStatusQueryOptions(workspaceId, pageId).queryKey,
    status,
  )
}

export const updatePagePermissionInCache = (
  queryClient: QueryClient,
  workspaceId: WorkspaceId,
  pageId: PageId,
  userId: string,
  role: PagePermissionRole,
) => {
  queryClient.setQueryData(
    pagePermissionsInfiniteQueryOptions(workspaceId, pageId).queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          payload: page.payload.map((perm) =>
            perm.userId === userId ? { ...perm, role } : perm,
          ),
        })),
      }
    },
  )
}

export const addPageMemberPermissionToCache = (
  queryClient: QueryClient,
  workspaceId: WorkspaceId,
  pageId: PageId,
  permission: PageMemberPermission,
) => {
  queryClient.setQueryData(
    pagePermissionsInfiniteQueryOptions(workspaceId, pageId).queryKey,
    (oldData) => {
      if (!oldData) return oldData
      const firstPage = oldData.pages[0]
      if (!firstPage) return oldData
      const exists = oldData.pages.some((page) =>
        page.payload.some((p) => p.userId === permission.userId),
      )
      if (exists) {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            payload: page.payload.map((p) =>
              p.userId === permission.userId ? permission : p,
            ),
          })),
        }
      }
      return {
        ...oldData,
        pages: [
          {
            ...firstPage,
            pagination: {
              ...firstPage.pagination,
              total: firstPage.pagination.total + 1,
            },
            payload: [permission, ...firstPage.payload],
          },
          ...oldData.pages.slice(1),
        ],
      }
    },
  )
}
