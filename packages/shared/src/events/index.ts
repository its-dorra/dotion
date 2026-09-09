import { z } from "zod";
import { workspaceId, pageId, commentId, userId } from "../ids";
import {
  PageSchema,
  PagePermissionRoleSchema,
  AllPageRoleSchema,
} from "../pages/schema";
import {
  WorkspaceInvitationWithDetailsSchema,
  WorkspaceMemberDetailSchema,
} from "../workspaces/schema";
import { CommentWithRepliesAndAuthorSchema } from "../comments/schema";

export const PageContentUpdatedEventSchema = z.object({
  type: z.literal("page.content_updated"),
  aggregateId: pageId,
  payload: z.object({
    workspaceId,
    pageId,
    version: z.number().optional(),
  }),
});

export const PageIndexingLegacyEventSchema = z.object({
  type: z.literal("page_indexing"),
  aggregateId: pageId,
  payload: z.object({
    workspaceId,
    pageId,
    version: z.number().optional(),
  }),
});

export const PageMetadataUpdatedEventSchema = z.object({
  type: z.literal("page.metadata_updated"),
  aggregateId: pageId,
  payload: z.object({
    workspaceId,
    pageId,
  }),
});

export const PageMovedToTrashEventSchema = z.object({
  type: z.literal("page.moved_to_trash"),
  aggregateId: pageId,
  payload: z.object({
    workspaceId,
    pageId,
    descendantIds: z.array(pageId),
  }),
});

export const PageRestoredEventSchema = z.object({
  type: z.literal("page.restored"),
  aggregateId: pageId,
  payload: z.object({
    workspaceId,
    page: PageSchema,
    descendantIds: z.array(pageId),
  }),
});

export const PageDeletedPermanentlyEventSchema = z.object({
  type: z.literal("page.deleted_permanently"),
  aggregateId: pageId,
  payload: z.object({
    workspaceId,
    pageId,
    allPageIds: z.array(pageId),
  }),
});

export const TrashEmptiedEventSchema = z.object({
  type: z.literal("workspace.trash_emptied"),
  aggregateId: workspaceId,
  payload: z.object({
    workspaceId,
    allPageIds: z.array(pageId),
  }),
});

export const PageCreatedEventSchema = z.object({
  type: z.literal("page.created"),
  aggregateId: pageId,
  payload: z.object({
    workspaceId,
    page: PageSchema,
  }),
});

export const PageAccessRequestedEventSchema = z.object({
  type: z.literal("page.access_requested"),
  aggregateId: z.string(),
  payload: z.object({
    workspaceId,
    pageId,
    pageTitle: z.string(),
    pageIcon: z.string().nullable(),
    requesterId: userId,
    requesterName: z.string(),
    requesterEmail: z.string(),
    recipientUserId: userId,
    requestedRole: PagePermissionRoleSchema.default("editor"),
    requestId: z.string().optional(),
  }),
});

export const PageAccessRequestResolvedEventSchema = z.object({
  type: z.literal("page.access_request_resolved"),
  aggregateId: z.string(),
  payload: z.object({
    workspaceId,
    pageId,
    pageTitle: z.string(),
    pageIcon: z.string().nullable().optional(),
    requesterId: userId,
    reviewerId: userId,
    reviewerName: z.string(),
    status: z.enum(["approved", "rejected"]),
    role: PagePermissionRoleSchema.optional(),
    requestId: z.string().optional(),
  }),
});

export const PagePermissionUpdatedEventSchema = z.object({
  type: z.literal("page.permission_updated"),
  aggregateId: pageId,
  payload: z.object({
    workspaceId,
    pageId,
    targetUserId: userId,
    role: AllPageRoleSchema,
    updatedByUserId: userId,
    pageTitle: z.string().optional(),
    updatedByName: z.string().optional(),
  }),
});

export const WorkspaceInvitationCreatedEventSchema = z.object({
  type: z.literal("workspace.invitation_created"),
  aggregateId: z.string(),
  payload: z.object({
    workspaceId,
    invitation: WorkspaceInvitationWithDetailsSchema,
    invitedUserId: userId,
    invitedByUserId: userId,
  }),
});

export const WorkspaceMemberJoinedEventSchema = z.object({
  type: z.literal("workspace.member_joined"),
  aggregateId: workspaceId,
  payload: z.object({
    workspaceId,
    invitationId: z.string(),
    member: WorkspaceMemberDetailSchema,
    userId,
  }),
});

export const WorkspaceMemberRemovedEventSchema = z.object({
  type: z.literal("workspace.member_removed"),
  aggregateId: workspaceId,
  payload: z.object({
    workspaceId,
    userId,
  }),
});

export const WorkspaceInvitationCancelledEventSchema = z.object({
  type: z.literal("workspace.invitation_cancelled"),
  aggregateId: z.string(),
  payload: z.object({
    workspaceId,
    invitationId: z.string(),
  }),
});

export const WorkspaceInvitationDeclinedEventSchema = z.object({
  type: z.literal("workspace.invitation_declined"),
  aggregateId: z.string(),
  payload: z.object({
    workspaceId,
    invitationId: z.string(),
  }),
});

export const CommentCreatedEventSchema = z.object({
  type: z.literal("comment.created"),
  aggregateId: commentId,
  payload: z.object({
    pageId,
    comment: CommentWithRepliesAndAuthorSchema,
  }),
});

export const CommentResolvedEventSchema = z.object({
  type: z.literal("comment.resolved"),
  aggregateId: commentId,
  payload: z.object({
    pageId,
    commentId,
  }),
});

export const CommentDeletedEventSchema = z.object({
  type: z.literal("comment.deleted"),
  aggregateId: commentId,
  payload: z.object({
    pageId,
    commentId,
    parentId: commentId.nullable(),
    isRoot: z.boolean(),
  }),
});

export const DomainEventSchema = z.discriminatedUnion("type", [
  PageCreatedEventSchema,
  PageContentUpdatedEventSchema,
  PageIndexingLegacyEventSchema,
  PageMetadataUpdatedEventSchema,
  PageMovedToTrashEventSchema,
  PageRestoredEventSchema,
  PageDeletedPermanentlyEventSchema,
  TrashEmptiedEventSchema,
  PageAccessRequestedEventSchema,
  PageAccessRequestResolvedEventSchema,
  PagePermissionUpdatedEventSchema,
  WorkspaceInvitationCreatedEventSchema,
  WorkspaceMemberJoinedEventSchema,
  WorkspaceMemberRemovedEventSchema,
  WorkspaceInvitationCancelledEventSchema,
  WorkspaceInvitationDeclinedEventSchema,
  CommentCreatedEventSchema,
  CommentResolvedEventSchema,
  CommentDeletedEventSchema,
]);

export type DomainEvent = z.infer<typeof DomainEventSchema>;
export type DomainEventType = DomainEvent["type"];
export type DomainEventByType<T extends DomainEventType> = Extract<
  DomainEvent,
  { type: T }
>;
export type DomainEventPayload<T extends DomainEventType> =
  DomainEventByType<T>["payload"];
