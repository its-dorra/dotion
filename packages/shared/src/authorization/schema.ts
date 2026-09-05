import { z } from "zod";
import {
  userId,
  workspaceId,
  workspaceInvitationId,
  pageId,
  commentId,
} from "../ids";
import { WorkspaceMemberRoleSchema } from "../workspaces/schema";
import { PagePermissionRoleSchema } from "../pages/schema";

// 1. Explicit Resource Action Enums
export const WorkspaceInstanceActionsSchema = z.enum([
  "view",
  "update",
  "delete",
  "inviteMember",
  "manageSettings",
]);
export const WorkspaceCollectionActionsSchema = z.enum(["create", "list"]);
export const WorkspaceActionsSchema = z.union([
  WorkspaceInstanceActionsSchema,
  WorkspaceCollectionActionsSchema,
]);

export const WorkspaceMemberInstanceActionsSchema = z.enum([
  "view",
  "updateRole",
  "remove",
]);
export const WorkspaceMemberCollectionActionsSchema = z.enum(["list"]);
export const WorkspaceMemberActionsSchema = z.union([
  WorkspaceMemberInstanceActionsSchema,
  WorkspaceMemberCollectionActionsSchema,
]);

export const WorkspaceInvitationInstanceActionsSchema = z.enum([
  "view",
  "accept",
  "decline",
  "cancel",
]);
export const WorkspaceInvitationCollectionActionsSchema = z.enum(["list"]);
export const WorkspaceInvitationActionsSchema = z.union([
  WorkspaceInvitationInstanceActionsSchema,
  WorkspaceInvitationCollectionActionsSchema,
]);

export const PageInstanceActionsSchema = z.enum([
  "view",
  "update",
  "delete",
  "restore",
  "move",
  "managePermissions",
  "share",
]);
export const PageCollectionActionsSchema = z.enum([
  "create",
  "list",
  "listTrash",
]);
export const PageActionsSchema = z.union([
  PageInstanceActionsSchema,
  PageCollectionActionsSchema,
]);

export const PagePermissionInstanceActionsSchema = z.enum([
  "view",
  "update",
  "delete",
]);
export const PagePermissionCollectionActionsSchema = z.enum(["list"]);
export const PagePermissionActionsSchema = z.union([
  PagePermissionInstanceActionsSchema,
  PagePermissionCollectionActionsSchema,
]);

export const CommentInstanceActionsSchema = z.enum([
  "view",
  "update",
  "resolve",
  "delete",
]);
export const CommentCollectionActionsSchema = z.enum(["create", "list"]);
export const CommentActionsSchema = z.union([
  CommentInstanceActionsSchema,
  CommentCollectionActionsSchema,
]);

export const UserInstanceActionsSchema = z.enum(["view", "update", "delete"]);
export const UserCollectionActionsSchema = z.enum(["list"]);
export const UserActionsSchema = z.union([
  UserInstanceActionsSchema,
  UserCollectionActionsSchema,
]);

// 2. Resource ID Inputs
export const WorkspaceInputSchema = z.object({
  workspaceId,
});

export const WorkspaceMemberInputSchema = z.object({
  workspaceId,
  memberUserId: userId,
});

export const WorkspaceInvitationInputSchema = z.object({
  invitationId: workspaceInvitationId,
});

export const PageInputSchema = z.object({
  pageId,
});

export const PagePermissionInputSchema = z.object({
  pageId,
  targetUserId: userId,
});

export const CommentInputSchema = z.object({
  commentId,
});

export const UserInputSchema = z.object({
  userId,
});

// 3. Central Schema Map (Single Source of Truth)
export const resourceSchemas = {
  workspace: {
    instanceActions: WorkspaceInstanceActionsSchema,
    collectionActions: WorkspaceCollectionActionsSchema,
    actions: WorkspaceActionsSchema,
    input: WorkspaceInputSchema,
    scopeInput: z.object({}),
    data: z.object({
      workspaceId,
      userRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    scope: z.object({}),
  },
  workspaceMember: {
    instanceActions: WorkspaceMemberInstanceActionsSchema,
    collectionActions: WorkspaceMemberCollectionActionsSchema,
    actions: WorkspaceMemberActionsSchema,
    input: WorkspaceMemberInputSchema,
    scopeInput: z.object({
      workspaceId,
    }),
    data: z.object({
      workspaceId,
      targetUserId: userId,
      targetRole: WorkspaceMemberRoleSchema,
      userRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    scope: z.object({
      workspaceId,
      userRole: WorkspaceMemberRoleSchema.nullable(),
    }),
  },
  workspaceInvitation: {
    instanceActions: WorkspaceInvitationInstanceActionsSchema,
    collectionActions: WorkspaceInvitationCollectionActionsSchema,
    actions: WorkspaceInvitationActionsSchema,
    input: WorkspaceInvitationInputSchema,
    scopeInput: z.object({
      workspaceId,
    }),
    data: z.object({
      invitationId: workspaceInvitationId,
      workspaceId,
      invitedUserId: userId.nullable(),
      invitedByUserId: userId,
      userRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    scope: z.object({
      workspaceId,
      userRole: WorkspaceMemberRoleSchema.nullable(),
    }),
  },
  page: {
    instanceActions: PageInstanceActionsSchema,
    collectionActions: PageCollectionActionsSchema,
    actions: PageActionsSchema,
    input: PageInputSchema,
    scopeInput: z.object({
      workspaceId,
    }),
    data: z.object({
      pageId,
      workspaceId,
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
      userPageRole: PagePermissionRoleSchema.nullable(),
    }),
    scope: z.object({
      workspaceId,
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
    }),
  },
  pagePermission: {
    instanceActions: PagePermissionInstanceActionsSchema,
    collectionActions: PagePermissionCollectionActionsSchema,
    actions: PagePermissionActionsSchema,
    input: PagePermissionInputSchema,
    scopeInput: z.object({
      pageId,
    }),
    data: z.object({
      pageId,
      workspaceId,
      targetUserId: userId,
      targetRole: PagePermissionRoleSchema.nullable(),
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    scope: z.object({
      pageId,
      workspaceId,
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
    }),
  },
  comment: {
    instanceActions: CommentInstanceActionsSchema,
    collectionActions: CommentCollectionActionsSchema,
    actions: CommentActionsSchema,
    input: CommentInputSchema,
    scopeInput: z.object({
      pageId: pageId.optional(),
    }),
    data: z.object({
      commentId,
      pageId,
      workspaceId,
      authorId: userId,
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
      userPageRole: PagePermissionRoleSchema.nullable(),
    }),
    scope: z.object({
      pageId,
      workspaceId,
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
      userPageRole: PagePermissionRoleSchema.nullable(),
    }),
  },
  user: {
    instanceActions: UserInstanceActionsSchema,
    collectionActions: UserCollectionActionsSchema,
    actions: UserActionsSchema,
    input: UserInputSchema,
    scopeInput: z.object({}),
    data: z.object({
      targetUserId: userId,
    }),
    scope: z.object({}),
  },
} as const;

export const ResourceTypeSchema = z.enum([
  "workspace",
  "workspaceMember",
  "workspaceInvitation",
  "page",
  "pagePermission",
  "comment",
  "user",
]);

// 4. All Action Enums Union (Strictly typed, no z.string())
export const AllActionsSchema = z.enum([
  "view",
  "update",
  "delete",
  "create",
  "list",
  "listTrash",
  "inviteMember",
  "manageSettings",
  "updateRole",
  "remove",
  "accept",
  "decline",
  "cancel",
  "restore",
  "move",
  "managePermissions",
  "share",
  "resolve",
]);

// 5. Query Schema for GET /authorization/check (Compatible with OpenAPI query parameters)
export const CheckPermissionQuerySchema = z
  .object({
    resource: ResourceTypeSchema,
    action: AllActionsSchema,
    workspaceId: workspaceId.optional(),
    pageId: pageId.optional(),
    commentId: commentId.optional(),
    invitationId: workspaceInvitationId.optional(),
    memberUserId: userId.optional(),
    targetUserId: userId.optional(),
    userId: userId.optional(),
  })
  .superRefine((data, ctx) => {
    const schema = resourceSchemas[data.resource];
    if (!schema) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid resource: ${data.resource}`,
        path: ["resource"],
      });
      return;
    }
    const actionResult = schema.actions.safeParse(data.action);
    if (!actionResult.success) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid action "${data.action}" for resource "${data.resource}"`,
        path: ["action"],
      });
    }
  });

export const CheckPermissionResponseSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
});
