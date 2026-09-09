import type { WorkspaceWsMessage } from '@dotion/shared/workspaces/types'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { PaginatedData } from '@dotion/shared/pagination/types'
import type { PageMemberPermission, PagePermissionRole } from './types'
import {
  pageDetailQueryOptions,
  pageTreeQueryOptions,
  pagesKeys,
} from './query-options'

export const handlePageAddedWsMessage = (
  queryClient: QueryClient,
  payload: Extract<WorkspaceWsMessage, { type: 'page.created' }>['payload'],
) => {
  queryClient.setQueryData(
    pageTreeQueryOptions(payload.workspaceId).queryKey,
    (oldData) => {
      if (!oldData) return oldData

      return [...oldData, payload]
    },
  )
}

export const handlePageMovedToTrashWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'page.moved_to_trash' }
  >['payload'],
) => {
  queryClient.invalidateQueries({
    queryKey: pagesKeys.tree(payload.workspaceId),
  })
  queryClient.invalidateQueries({
    queryKey: pagesKeys.trash(payload.workspaceId),
  })
  queryClient.invalidateQueries({
    queryKey: pagesKeys.detail(payload.pageId),
  })
  if (payload.pageIds) {
    for (const pid of payload.pageIds) {
      queryClient.invalidateQueries({
        queryKey: pagesKeys.detail(pid),
      })
    }
  }
}

export const handlePageRestoredWsMessage = (
  queryClient: QueryClient,
  payload: Extract<WorkspaceWsMessage, { type: 'page.restored' }>['payload'],
) => {
  queryClient.invalidateQueries({
    queryKey: pagesKeys.tree(payload.workspaceId),
  })
  queryClient.invalidateQueries({
    queryKey: pagesKeys.trash(payload.workspaceId),
  })
  queryClient.invalidateQueries({
    queryKey: pagesKeys.detail(payload.id),
  })
}

export const handlePageDeletedPermanentlyWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'page.deleted_permanently' }
  >['payload'],
) => {
  queryClient.invalidateQueries({
    queryKey: pagesKeys.tree(payload.workspaceId),
  })
  queryClient.invalidateQueries({
    queryKey: pagesKeys.trash(payload.workspaceId),
  })
  queryClient.removeQueries({
    queryKey: pagesKeys.detail(payload.pageId),
  })
  if (payload.pageIds) {
    for (const pid of payload.pageIds) {
      queryClient.removeQueries({
        queryKey: pagesKeys.detail(pid),
      })
    }
  }
}

export const handleTrashEmptiedWsMessage = (
  queryClient: QueryClient,
  payload: Extract<WorkspaceWsMessage, { type: 'trash.emptied' }>['payload'],
) => {
  queryClient.setQueryData(pagesKeys.trash(payload.workspaceId), [])
  queryClient.invalidateQueries({
    queryKey: pagesKeys.trash(payload.workspaceId),
  })
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
  workspaceId: string,
  pageId: string,
  status: { hasPendingRequest: boolean; request: any | null },
) => {
  queryClient.setQueryData(
    pagesKeys.accessRequestStatus(workspaceId, pageId),
    status,
  )
}

export const updatePagePermissionInCache = (
  queryClient: QueryClient,
  workspaceId: string,
  pageId: string,
  userId: string,
  role: PagePermissionRole,
) => {
  queryClient.setQueriesData<InfiniteData<PaginatedData<PageMemberPermission>>>(
    { queryKey: pagesKeys.permissions(workspaceId, pageId) },
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
