import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { Notification, PaginatedData } from './types'
import { notificationsKeys } from './query-options'

export const markNotificationAsReadInCache = (
  queryClient: QueryClient,
  notificationId: string,
) => {
  queryClient.setQueriesData<InfiniteData<PaginatedData<Notification>>>(
    { queryKey: notificationsKeys.all },
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

export const markAllNotificationsAsReadInCache = (
  queryClient: QueryClient,
  workspaceId?: string,
) => {
  queryClient.setQueriesData<InfiniteData<PaginatedData<Notification>>>(
    { queryKey: notificationsKeys.all },
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

export const addNotificationToCache = (
  queryClient: QueryClient,
  notification: Notification,
) => {
  queryClient.setQueriesData<InfiniteData<PaginatedData<Notification>>>(
    { queryKey: notificationsKeys.all },
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
