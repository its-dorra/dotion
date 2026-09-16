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
  "deletePermanently",
  "move",
  "managePermissions",
  "share",
]);
export const PageCollectionActionsSchema = z.enum([
  "create",
  "list",
  "listTrash",
  "emptyTrash",
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

export const WorkspaceTargetSchema = z.object({
  workspaceId,
});
export const WorkspaceInputSchema = WorkspaceTargetSchema;

export const WorkspaceMemberTargetSchema = z.object({
  workspaceId,
  memberUserId: userId,
});
export const WorkspaceMemberInputSchema = WorkspaceMemberTargetSchema;

export const WorkspaceInvitationTargetSchema = z.object({
  invitationId: workspaceInvitationId,
});
export const WorkspaceInvitationInputSchema = WorkspaceInvitationTargetSchema;

export const PageTargetSchema = z.object({
  pageId,
});
export const PageInputSchema = PageTargetSchema;

export const PagePermissionTargetSchema = z.object({
  pageId,
  targetUserId: userId,
});
export const PagePermissionInputSchema = PagePermissionTargetSchema;

export const CommentTargetSchema = z.object({
  commentId,
});
export const CommentInputSchema = CommentTargetSchema;

export const UserTargetSchema = z.object({
  userId,
});
export const UserInputSchema = UserTargetSchema;

export const resourceSchemas = {
  workspace: {
    instanceActions: WorkspaceInstanceActionsSchema,
    collectionActions: WorkspaceCollectionActionsSchema,
    actions: WorkspaceActionsSchema,
    target: WorkspaceTargetSchema,
    container: z.object({}),
    attributes: z.object({
      workspaceId,
      userRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    containerAttributes: z.object({}),
    // Backward compatibility aliases
    input: WorkspaceTargetSchema,
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
    target: WorkspaceMemberTargetSchema,
    container: z.object({
      workspaceId,
    }),
    attributes: z.object({
      workspaceId,
      targetUserId: userId,
      targetRole: WorkspaceMemberRoleSchema,
      userRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    containerAttributes: z.object({
      workspaceId,
      userRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    // Backward compatibility aliases
    input: WorkspaceMemberTargetSchema,
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
    target: WorkspaceInvitationTargetSchema,
    container: z.object({
      workspaceId,
    }),
    attributes: z.object({
      invitationId: workspaceInvitationId,
      workspaceId,
      invitedUserId: userId.nullable(),
      invitedByUserId: userId,
      userRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    containerAttributes: z.object({
      workspaceId,
      userRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    // Backward compatibility aliases
    input: WorkspaceInvitationTargetSchema,
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
    target: PageTargetSchema,
    container: z.object({
      workspaceId,
    }),
    attributes: z.object({
      pageId,
      workspaceId,
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
      userPageRole: PagePermissionRoleSchema.nullable(),
    }),
    containerAttributes: z.object({
      workspaceId,
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    // Backward compatibility aliases
    input: PageTargetSchema,
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
    target: PagePermissionTargetSchema,
    container: z.object({
      pageId,
    }),
    attributes: z.object({
      pageId,
      workspaceId,
      targetUserId: userId,
      targetRole: PagePermissionRoleSchema.nullable(),
      targetUserWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    containerAttributes: z.object({
      pageId,
      workspaceId,
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
    }),
    // Backward compatibility aliases
    input: PagePermissionTargetSchema,
    scopeInput: z.object({
      pageId,
    }),
    data: z.object({
      pageId,
      workspaceId,
      targetUserId: userId,
      targetRole: PagePermissionRoleSchema.nullable(),
      targetUserWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
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
    target: CommentTargetSchema,
    container: z.object({
      pageId,
    }),
    attributes: z.object({
      commentId,
      pageId,
      workspaceId,
      authorId: userId,
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
      userPageRole: PagePermissionRoleSchema.nullable(),
    }),
    containerAttributes: z.object({
      pageId,
      workspaceId,
      userWorkspaceRole: WorkspaceMemberRoleSchema.nullable(),
      userPageRole: PagePermissionRoleSchema.nullable(),
    }),
    // Backward compatibility aliases
    input: CommentTargetSchema,
    scopeInput: z.object({
      pageId,
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
    target: UserTargetSchema,
    container: z.object({}),
    attributes: z.object({
      targetUserId: userId,
    }),
    containerAttributes: z.object({}),
    // Backward compatibility aliases
    input: UserTargetSchema,
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

const allActionValues = Array.from(
  new Set([
    ...WorkspaceInstanceActionsSchema.options,
    ...WorkspaceCollectionActionsSchema.options,
    ...WorkspaceMemberInstanceActionsSchema.options,
    ...WorkspaceMemberCollectionActionsSchema.options,
    ...WorkspaceInvitationInstanceActionsSchema.options,
    ...WorkspaceInvitationCollectionActionsSchema.options,
    ...PageInstanceActionsSchema.options,
    ...PageCollectionActionsSchema.options,
    ...PagePermissionInstanceActionsSchema.options,
    ...PagePermissionCollectionActionsSchema.options,
    ...CommentInstanceActionsSchema.options,
    ...CommentCollectionActionsSchema.options,
    ...UserInstanceActionsSchema.options,
    ...UserCollectionActionsSchema.options,
  ]),
) as [string, ...string[]];

export const AllActionsSchema = z.enum(allActionValues);

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
