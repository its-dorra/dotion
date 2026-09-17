import type { QueryClient } from '@tanstack/react-query'
import type { Notification } from './types'
import { notificationsInfiniteQueryOptions } from './query-options'

export const markNotificationAsReadInCache = ({
  queryClient,
  notificationId,
}: {
  queryClient: QueryClient
  notificationId: string
}) => {
  queryClient.setQueryData(
    notificationsInfiniteQueryOptions().queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          payload: page.payload.map((notif) =>
            notif.id === notificationId ? { ...notif, isRead: true } : notif,
          ),
        })),
      }
    },
  )
}

export const markAllNotificationsAsReadInCache = ({
  queryClient,
  workspaceId,
}: {
  queryClient: QueryClient
  workspaceId?: string
}) => {
  queryClient.setQueryData(
    notificationsInfiniteQueryOptions().queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          payload: page.payload.map((notif) => {
            if (
              !workspaceId ||
              (notif.metadata as { workspaceId?: string })?.workspaceId ===
                workspaceId
            ) {
              return { ...notif, isRead: true }
            }
            return notif
          }),
        })),
      }
    },
  )
}

export const addNotificationToCache = ({
  queryClient,
  notification,
}: {
  queryClient: QueryClient
  notification: Notification
}) => {
  queryClient.setQueryData(
    notificationsInfiniteQueryOptions().queryKey,
    (oldData) => {
      if (!oldData) return oldData
      const [firstPage, ...restPages] = oldData.pages
      if (!firstPage) return oldData

      if (
        oldData.pages.some((page) =>
          page.payload.some((n) => n.id === notification.id),
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
            payload: [notification, ...firstPage.payload],
          },
          ...restPages,
        ],
      }
    },
  )
}

export const removeNotificationByInvitationIdFromCache = ({
  queryClient,
  invitationId,
}: {
  queryClient: QueryClient
  invitationId: string
}) => {
  queryClient.setQueryData(
    notificationsInfiniteQueryOptions().queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          payload: page.payload.filter(
            (n) =>
              !(
                n.metadata?.type === 'workspace.invitation_created' &&
                n.metadata.workspaceInvitationId === invitationId
              ),
          ),
        })),
      }
    },
  )
}
