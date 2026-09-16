import { z } from "zod";
import { notifications } from "@dotion/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import {
  notificationId,
  userId,
  workspaceId,
  pageId,
  workspaceInvitationId,
} from "../ids";
import { createPaginatedDataSchema } from "../pagination/schema";
import { PagePermissionRoleSchema, AllPageRoleSchema } from "../pages/schema";

export { notificationId };

export const NotificationTypeSchema = z.enum([
  "workspace_invitation",
  "page_invitation",
  "permission_change",
  "page_access_request",
  "page_access_request_resolved",
]);

export const WorkspaceInvitationNotificationMetadataSchema = z.object({
  type: z.literal("workspace_invitation"),
  workspaceInvitationId: workspaceInvitationId,
  workspaceId: workspaceId,
  workspaceName: z.string(),
  workspaceIcon: z.string().optional(),
  invitedByUserId: userId,
  invitedByName: z.string(),
});

export const PageInvitationNotificationMetadataSchema = z.object({
  type: z.literal("page_invitation"),
  pageId: pageId,
  workspaceId: workspaceId,
  pageTitle: z.string(),
  pageIcon: z.string().optional(),
  invitedByUserId: userId,
  invitedByName: z.string(),
  role: PagePermissionRoleSchema,
});

export const PermissionChangeNotificationMetadataSchema = z.object({
  type: z.literal("permission_change"),
  pageId: pageId,
  workspaceId: workspaceId,
  pageTitle: z.string(),
  changedByUserId: userId,
  changedByName: z.string(),
  newRole: AllPageRoleSchema,
});

export const PageAccessRequestNotificationMetadataSchema = z.object({
  type: z.literal("page_access_request"),
  requestId: z.string(),
  pageId: pageId,
  workspaceId: workspaceId,
  pageTitle: z.string(),
  requestedRole: PagePermissionRoleSchema.default("editor"),
  requestedByUserId: userId,
  requestedByName: z.string(),
  requestedByEmail: z.string(),
});

export const PageAccessRequestResolvedNotificationMetadataSchema = z.object({
  type: z.literal("page_access_request_resolved"),
  requestId: z.string(),
  pageId: pageId,
  workspaceId: workspaceId,
  pageTitle: z.string(),
  resolvedByUserId: userId,
  resolvedByName: z.string(),
  status: z.enum(["approved", "rejected"]),
  role: PagePermissionRoleSchema,
});

export const NotificationMetadataSchema = z.discriminatedUnion("type", [
  WorkspaceInvitationNotificationMetadataSchema,
  PageInvitationNotificationMetadataSchema,
  PermissionChangeNotificationMetadataSchema,
  PageAccessRequestNotificationMetadataSchema,
  PageAccessRequestResolvedNotificationMetadataSchema,
]);

export const NotificationSchema = createSelectSchema(notifications, {
  id: notificationId,
  userId,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).extend({
  metadata: NotificationMetadataSchema,
});

export const CreateNotificationSchema = createInsertSchema(notifications, {
  id: notificationId.optional(),
  userId,
})
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    metadata: NotificationMetadataSchema,
  });

export const PaginatedNotificationsDataSchema =
  createPaginatedDataSchema(NotificationSchema);
