import { z } from "zod";

export const userId = z.string().brand("UserId");
export const workspaceId = z.uuid().brand("WorkspaceId");
export const workspaceInvitationId = z.uuid().brand("WorkspaceInvitationId");
export const pageId = z.uuid().brand("PageId");
export const commentId = z.uuid().brand("CommentId");
export const notificationId = z.uuid().brand("NotificationId");
export const fileId = z.string().brand("FileId");
export const pageSectionId = z.uuid().brand("PageSectionId");
export const assistantThreadId = z.uuid().brand("AssistantThreadId");
export const assistantMessageId = z.uuid().brand("AssistantMessageId");
export const outboxEntryId = z.uuid().brand("OutboxEntryId");

export type UserId = z.infer<typeof userId>;
export type WorkspaceId = z.infer<typeof workspaceId>;
export type WorkspaceInvitationId = z.infer<typeof workspaceInvitationId>;
export type PageId = z.infer<typeof pageId>;
export type CommentId = z.infer<typeof commentId>;
export type NotificationId = z.infer<typeof notificationId>;
export type FileId = z.infer<typeof fileId>;
export type PageSectionId = z.infer<typeof pageSectionId>;
export type AssistantThreadId = z.infer<typeof assistantThreadId>;
export type AssistantMessageId = z.infer<typeof assistantMessageId>;
export type OutboxEntryId = z.infer<typeof outboxEntryId>;
