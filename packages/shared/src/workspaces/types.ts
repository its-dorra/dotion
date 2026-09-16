import type { z } from "zod";
import type {
  workspaceId,
  workspaceInvitationId,
  CreateWorkspaceSchema,
  WorkspaceSchema,
  CreateWorkspaceMemberSchema,
  WorkspaceMemberRoleSchema,
  WorkspaceMemberDetailSchema,
  UpdateMemberRoleSchema,
  WorkspaceInvitationSchema,
  CreateWorkspaceInvitationSchema,
  InviteMemberSchema,
  WorkspaceInvitationWithDetailsSchema,
  PaginatedWorkspaceMembersDataSchema,
  PaginatedWorkspaceInvitationsDataSchema,
} from "./schema";
import type { WorkspaceWsMessageSchema } from "./ws.schema";

export type WorkspaceId = z.infer<typeof workspaceId>;
export type WorkspaceInvitationId = z.infer<typeof workspaceInvitationId>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type WorkspaceRole = z.infer<typeof WorkspaceMemberRoleSchema>;
export type CreateWorkspaceMemberInput = z.infer<
  typeof CreateWorkspaceMemberSchema
>;
export type WorkspaceMemberDetail = z.infer<typeof WorkspaceMemberDetailSchema>;
export type UpdateMemberRoleInput = z.infer<typeof UpdateMemberRoleSchema>;
export type WorkspaceInvitation = z.infer<typeof WorkspaceInvitationSchema>;
export type CreateWorkspaceInvitationInput = z.infer<
  typeof CreateWorkspaceInvitationSchema
>;
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
export type WorkspaceInvitationWithDetails = z.infer<
  typeof WorkspaceInvitationWithDetailsSchema
>;
export type PaginatedWorkspaceMembers = z.infer<
  typeof PaginatedWorkspaceMembersDataSchema
>;
export type PaginatedWorkspaceInvitations = z.infer<
  typeof PaginatedWorkspaceInvitationsDataSchema
>;

export type WorkspaceWsMessage = z.infer<typeof WorkspaceWsMessageSchema>;
