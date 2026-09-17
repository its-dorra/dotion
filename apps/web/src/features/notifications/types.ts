import type {
  NotificationId,
  NotificationType,
  Notification,
  NotificationMetadata,
  WorkspaceInvitationNotificationMetadata,
  PageInvitationNotificationMetadata,
  PermissionChangeNotificationMetadata,
  PageAccessRequestNotificationMetadata,
  PageAccessRequestResolvedNotificationMetadata,
  CreateNotificationInput,
  PaginatedNotifications,
} from '@dotion/shared/notifications/types'
import type { PaginatedData } from '@dotion/shared/pagination/types'

export type {
  NotificationId,
  NotificationType,
  Notification,
  NotificationMetadata,
  WorkspaceInvitationNotificationMetadata,
  PageInvitationNotificationMetadata,
  PermissionChangeNotificationMetadata,
  PageAccessRequestNotificationMetadata,
  PageAccessRequestResolvedNotificationMetadata,
  CreateNotificationInput,
  PaginatedNotifications,
  PaginatedData,
}

export type TypedNotification<M extends NotificationMetadata> = Omit<
  Notification,
  'metadata'
> & {
  metadata: M
}

export type WorkspaceInvitationNotification =
  TypedNotification<WorkspaceInvitationNotificationMetadata>
export type PageInvitationNotification =
  TypedNotification<PageInvitationNotificationMetadata>
export type PermissionChangeNotification =
  TypedNotification<PermissionChangeNotificationMetadata>
export type PageAccessRequestNotification =
  TypedNotification<PageAccessRequestNotificationMetadata>
export type PageAccessRequestResolvedNotification =
  TypedNotification<PageAccessRequestResolvedNotificationMetadata>

export interface MarkAsReadInput {
  notificationId: string
}

export interface MarkAllAsReadInput {
  workspaceId?: string
}
