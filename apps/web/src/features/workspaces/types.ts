export type WorkspaceRole = "owner" | "admin" | "member";

export interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  icon?: string;
  memberCount: number;
  createdAt: string;
  currentUserRole: WorkspaceRole;
}

export type InvitationStatus = "pending" | "accepted" | "declined";

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceIcon?: string;
  invitedEmail: string;
  invitedByName: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  createdAt: string;
}

export interface CreateWorkspaceInput {
  name: string;
  icon?: string;
}

export interface InviteMemberInput {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  /** The acting user's role — only owners and admins may invite members. */
  actingUserRole: WorkspaceRole;
}

export interface AcceptInvitationInput {
  invitationId: string;
}

export interface UpdateMemberRoleInput {
  workspaceId: string;
  memberId: string;
  role: WorkspaceRole;
  /** The acting user's role — only owners and admins may change roles. */
  actingUserRole: WorkspaceRole;
}

export interface RemoveMemberInput {
  workspaceId: string;
  memberId: string;
  /** The acting user's role — only owners and admins may remove members. */
  actingUserRole: WorkspaceRole;
}

export interface UpdateWorkspaceInput {
  workspaceId: string;
  name?: string;
  icon?: string;
}
