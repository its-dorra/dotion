import type {
  WorkspaceWsMessage,
  WorkspaceInvitation,
  WorkspaceMember,
  PaginatedData,
} from './types'
import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { workspacesKeys } from './query-options'

export const removeWorkspaceInvitationFromCache = (
  queryClient: QueryClient,
  workspaceId: string,
  invitationId: string,
) => {
  queryClient.setQueriesData<InfiniteData<PaginatedData<WorkspaceInvitation>>>(
    { queryKey: workspacesKeys.workspaceInvitations(workspaceId) },
    (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => {
          const filtered = page.payload.filter((inv) => inv.id !== invitationId)
          const diff = page.payload.length - filtered.length
          return {
            ...page,
            pagination: {
              ...page.pagination,
              total: Math.max(0, page.pagination.total - diff),
            },
            payload: filtered,
          }
        }),
      }
    },
  )
}

export const addWorkspaceInvitationToCache = (
  queryClient: QueryClient,
  workspaceId: string,
  invitation: WorkspaceInvitation,
) => {
  queryClient.setQueriesData<InfiniteData<PaginatedData<WorkspaceInvitation>>>(
    { queryKey: workspacesKeys.workspaceInvitations(workspaceId) },
    (oldData) => {
      if (!oldData) return oldData
      const [firstPage, ...restPages] = oldData.pages
      if (!firstPage) return oldData

      if (
        oldData.pages.some((page) =>
          page.payload.some((inv) => inv.id === invitation.id),
        )
      ) {
        return oldData
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
            payload: [invitation, ...firstPage.payload],
          },
          ...restPages,
        ],
      }
    },
  )
}

export const addWorkspaceMemberToCache = (
  queryClient: QueryClient,
  workspaceId: string,
  member: WorkspaceMember,
) => {
  queryClient.setQueriesData<InfiniteData<PaginatedData<WorkspaceMember>>>(
    { queryKey: workspacesKeys.members(workspaceId) },
    (oldData) => {
      if (!oldData) return oldData
      const [firstPage, ...restPages] = oldData.pages
      if (!firstPage) return oldData

      if (
        oldData.pages.some((page) =>
          page.payload.some((m) => m.userId === member.userId),
        )
      ) {
        return oldData
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
            payload: [...firstPage.payload, member],
          },
          ...restPages,
        ],
      }
    },
  )
}

export const removeWorkspaceMemberFromCache = (
  queryClient: QueryClient,
  workspaceId: string,
  userId: string,
) => {
  queryClient.setQueriesData<InfiniteData<PaginatedData<WorkspaceMember>>>(
    { queryKey: workspacesKeys.members(workspaceId) },
    (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => {
          const filtered = page.payload.filter((m) => m.userId !== userId)
          const diff = page.payload.length - filtered.length
          return {
            ...page,
            pagination: {
              ...page.pagination,
              total: Math.max(0, page.pagination.total - diff),
            },
            payload: filtered,
          }
        }),
      }
    },
  )
}

export const updateWorkspaceMemberRoleInCache = (
  queryClient: QueryClient,
  workspaceId: string,
  userId: string,
  role: 'owner' | 'member',
) => {
  queryClient.setQueriesData<InfiniteData<PaginatedData<WorkspaceMember>>>(
    { queryKey: workspacesKeys.members(workspaceId) },
    (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          payload: page.payload.map((m) =>
            m.userId === userId ? { ...m, role } : m,
          ),
        })),
      }
    },
  )
}

export const handleInvitationCreatedWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'workspace.invitation_created' }
  >['payload'],
) => {
  addWorkspaceInvitationToCache(queryClient, payload.workspaceId, payload)
}

export const handleInvitationDeclinedWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'workspace.invitation_declined' }
  >['payload'],
) => {
  removeWorkspaceInvitationFromCache(
    queryClient,
    payload.workspaceId,
    payload.invitationId,
  )
}

export const handleInvitationCancelledWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'workspace.invitation_cancelled' }
  >['payload'],
) => {
  removeWorkspaceInvitationFromCache(
    queryClient,
    payload.workspaceId,
    payload.invitationId,
  )
}

export const handleMemberJoinedWsMessage = (
  queryClient: QueryClient,
  workspaceId: string,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'workspace.member_joined' }
  >['payload'],
) => {
  const targetWorkspaceId = payload.workspaceId ?? workspaceId
  if (payload.invitationId) {
    removeWorkspaceInvitationFromCache(
      queryClient,
      targetWorkspaceId,
      payload.invitationId,
    )
  }
  addWorkspaceMemberToCache(queryClient, targetWorkspaceId, payload.member)
}

export const handleMemberRemovedWsMessage = (
  queryClient: QueryClient,
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'workspace.member_removed' }
  >['payload'],
) => {
  removeWorkspaceMemberFromCache(
    queryClient,
    payload.workspaceId,
    payload.userId,
  )
}
