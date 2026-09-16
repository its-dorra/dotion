import type { z } from "zod";
import type {
  notificationId,
  NotificationTypeSchema,
  NotificationMetadataSchema,
  WorkspaceInvitationNotificationMetadataSchema,
  PageInvitationNotificationMetadataSchema,
  PermissionChangeNotificationMetadataSchema,
  PageAccessRequestNotificationMetadataSchema,
  NotificationSchema,
  CreateNotificationSchema,
  PaginatedNotificationsDataSchema,
} from "./schema";

export type NotificationId = z.infer<typeof notificationId>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationMetadata = z.infer<typeof NotificationMetadataSchema>;
export type WorkspaceInvitationNotificationMetadata = z.infer<
  typeof WorkspaceInvitationNotificationMetadataSchema
>;
export type PageInvitationNotificationMetadata = z.infer<
  typeof PageInvitationNotificationMetadataSchema
>;
export type PermissionChangeNotificationMetadata = z.infer<
  typeof PermissionChangeNotificationMetadataSchema
>;
export type PageAccessRequestNotificationMetadata = z.infer<
  typeof PageAccessRequestNotificationMetadataSchema
>;

export type Notification = z.infer<typeof NotificationSchema>;
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type PaginatedNotifications = z.infer<
  typeof PaginatedNotificationsDataSchema
>;

export type { UserWsMessage } from "./ws.schema";
