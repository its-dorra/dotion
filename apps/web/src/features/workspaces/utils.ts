import type {
  WorkspaceWsMessage,
  WorkspaceInvitation,
  WorkspaceMember,
  WorkspaceId,
} from './types'
import type { QueryClient } from '@tanstack/react-query'
import {
  workspaceInvitationsInfiniteQueryOptions,
  workspaceMembersInfiniteQueryOptions,
} from './query-options'

export const removeWorkspaceInvitationFromCache = ({
  queryClient,
  workspaceId,
  invitationId,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  invitationId: string
}) => {
  queryClient.setQueryData(
    workspaceInvitationsInfiniteQueryOptions(workspaceId).queryKey,
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

export const addWorkspaceInvitationToCache = ({
  queryClient,
  workspaceId,
  invitation,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  invitation: WorkspaceInvitation
}) => {
  queryClient.setQueryData(
    workspaceInvitationsInfiniteQueryOptions(workspaceId).queryKey,
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

export const addWorkspaceMemberToCache = ({
  queryClient,
  workspaceId,
  member,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  member: WorkspaceMember
}) => {
  queryClient.setQueryData(
    workspaceMembersInfiniteQueryOptions(workspaceId).queryKey,
    (oldData) => {
      if (!oldData) return oldData
      const [firstPage, ...restPages] = oldData.pages
      if (!firstPage) return oldData

      if (
        oldData.pages.some((page) =>
          page.payload.some((m) => m.userId === member.userId),
        )
      ) {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            payload: page.payload.map((m) =>
              m.userId === member.userId ? { ...m, ...member } : m,
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
            payload: [...firstPage.payload, member],
          },
          ...restPages,
        ],
      }
    },
  )
}

export const removeWorkspaceMemberFromCache = ({
  queryClient,
  workspaceId,
  userId,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  userId: string
}) => {
  queryClient.setQueryData(
    workspaceMembersInfiniteQueryOptions(workspaceId).queryKey,
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

export const updateWorkspaceMemberRoleInCache = ({
  queryClient,
  workspaceId,
  userId,
  role,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  userId: string
  role: 'owner' | 'member'
}) => {
  queryClient.setQueryData(
    workspaceMembersInfiniteQueryOptions(workspaceId).queryKey,
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

export const handleInvitationCreatedWsMessage = ({
  queryClient,
  payload,
}: {
  queryClient: QueryClient
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'workspace.invitation_created' }
  >['payload']
}) => {
  addWorkspaceInvitationToCache({
    queryClient,
    workspaceId: payload.workspaceId,
    invitation: payload,
  })
}

export const handleInvitationDeclinedWsMessage = ({
  queryClient,
  payload,
}: {
  queryClient: QueryClient
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'workspace.invitation_declined' }
  >['payload']
}) => {
  removeWorkspaceInvitationFromCache({
    queryClient,
    workspaceId: payload.workspaceId,
    invitationId: payload.invitationId,
  })
}

export const handleInvitationCancelledWsMessage = ({
  queryClient,
  payload,
}: {
  queryClient: QueryClient
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'workspace.invitation_cancelled' }
  >['payload']
}) => {
  removeWorkspaceInvitationFromCache({
    queryClient,
    workspaceId: payload.workspaceId,
    invitationId: payload.invitationId,
  })
}

export const handleMemberJoinedWsMessage = ({
  queryClient,
  workspaceId,
  payload,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'workspace.member_joined' }
  >['payload']
}) => {
  const targetWorkspaceId = payload.workspaceId ?? workspaceId
  if (payload.invitationId) {
    removeWorkspaceInvitationFromCache({
      queryClient,
      workspaceId: targetWorkspaceId,
      invitationId: payload.invitationId,
    })
  }
  addWorkspaceMemberToCache({
    queryClient,
    workspaceId: targetWorkspaceId,
    member: payload.member,
  })
}

export const handleMemberRemovedWsMessage = ({
  queryClient,
  payload,
}: {
  queryClient: QueryClient
  payload: Extract<
    WorkspaceWsMessage,
    { type: 'workspace.member_removed' }
  >['payload']
}) => {
  removeWorkspaceMemberFromCache({
    queryClient,
    workspaceId: payload.workspaceId,
    userId: payload.userId,
  })
}
