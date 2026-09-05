import { z } from "zod";
import {
  workspaces,
  workspaceMembers,
  workspaceInvitations,
} from "@dotion/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { workspaceId, workspaceInvitationId, userId } from "../ids";
import { createPaginatedDataSchema } from "../pagination/schema";

export { workspaceId, workspaceInvitationId };

export const CreateWorkspaceSchema = createInsertSchema(workspaces).pick({
  name: true,
  icon: true,
});

export const WorkspaceSchema = createSelectSchema(workspaces, {
  id: workspaceId,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const WorkspaceMemberRoleSchema = z.enum(["owner", "member"]);

export const CreateWorkspaceMemberSchema = createInsertSchema(
  workspaceMembers,
  {
    workspaceId,
    userId,
  },
).pick({
  workspaceId: true,
  userId: true,
  role: true,
});

export const WorkspaceMemberDetailSchema = z.object({
  id: z.string(),
  userId,
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  role: WorkspaceMemberRoleSchema,
  joinedAt: z.coerce.date(),
});

export const UpdateMemberRoleSchema = z.object({
  role: WorkspaceMemberRoleSchema,
});

export const WorkspaceInvitationSchema = createSelectSchema(
  workspaceInvitations,
  {
    id: workspaceInvitationId,
    workspaceId,
    invitedUserId: userId,
    invitedByUserId: userId,
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  },
);

export const CreateWorkspaceInvitationSchema = createInsertSchema(
  workspaceInvitations,
  {
    id: workspaceInvitationId.optional(),
    workspaceId,
    invitedUserId: userId,
    invitedByUserId: userId,
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const InviteMemberSchema = z.object({
  userId: userId.optional(),
  email: z.email().optional(),
});

export const WorkspaceInvitationWithDetailsSchema =
  WorkspaceInvitationSchema.extend({
    workspaceName: z.string(),
    workspaceIcon: z.string().nullable(),
    invitedByName: z.string(),
    invitedUserEmail: z.string(),
    invitedUserName: z.string(),
  });

export const PaginatedWorkspaceMembersDataSchema = createPaginatedDataSchema(
  WorkspaceMemberDetailSchema,
);

export const PaginatedWorkspaceInvitationsDataSchema =
  createPaginatedDataSchema(WorkspaceInvitationWithDetailsSchema);
