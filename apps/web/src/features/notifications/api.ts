import { Result } from 'better-result'
import { AppError } from '@/lib/errors'
import { getApiClient } from '@/lib/api-client'
import { NotificationNotFoundError } from './errors'
import type { Notification } from './types'
import type {
  PaginationQuery,
  PaginatedData,
} from '@dotion/shared/pagination/types'

export class NotificationsApi {
  async getNotifications(
    pagination: PaginationQuery = { page: 1, limit: 20 },
  ): Promise<Result<PaginatedData<Notification>, AppError>> {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.notifications.$get({
        query: {
          page: String(pagination.page),
          limit: String(pagination.limit),
        },
      })

      if (!response.ok) {
        return Result.err(
          new AppError({
            source: 'notifications',
            message: 'Failed to load notifications.',
          }),
        )
      }

      const data = await response.json()

      return Result.ok(data.data as unknown as PaginatedData<Notification>)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'notifications',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to load notifications.',
        }),
      )
    }
  }

  async markAsRead(
    notificationId: string,
  ): Promise<Result<true, NotificationNotFoundError | AppError>> {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.notifications[':id'].read.$patch({
        param: { id: notificationId },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return Result.err(
            new NotificationNotFoundError({
              message: 'This notification no longer exists.',
              notificationId,
            }),
          )
        }

        return Result.err(
          new AppError({
            source: 'notifications',
            message: 'Failed to mark notification as read.',
          }),
        )
      }

      return Result.ok(true)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'notifications',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to mark notification as read.',
        }),
      )
    }
  }

  async markAllAsRead(): Promise<Result<true, AppError>> {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.notifications['read-all'].$post()

      if (!response.ok) {
        return Result.err(
          new AppError({
            source: 'notifications',
            message: 'Failed to mark all notifications as read.',
          }),
        )
      }

      return Result.ok(true)
    } catch (error) {
      return Result.err(
        new AppError({
          source: 'notifications',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to mark all notifications as read.',
        }),
      )
    }
  }
}

export const notificationsApi = new NotificationsApi()
