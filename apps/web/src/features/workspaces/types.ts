import type { UserId } from '@dotion/shared/users/types'
import type {
  WorkspaceId,
  Workspace,
  CreateWorkspaceInput,
  WorkspaceWsMessage,
  WorkspaceMemberDetail,
  WorkspaceInvitationWithDetails,
} from '@dotion/shared/workspaces/types'
import type { PaginatedData } from '@dotion/shared/pagination/types'
import type { UserSearchResult } from '@dotion/shared/users/types'

export type {
  WorkspaceId,
  Workspace,
  CreateWorkspaceInput,
  WorkspaceWsMessage,
  WorkspaceMemberDetail,
  WorkspaceInvitationWithDetails,
  PaginatedData,
  UserSearchResult,
}

export type WorkspaceRole = 'owner' | 'member'

export type WorkspaceMember = WorkspaceMemberDetail

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export type WorkspaceInvitation = WorkspaceInvitationWithDetails

export interface InviteMemberInput {
  workspaceId: WorkspaceId
  userId?: UserId
  email?: string
}

export interface AcceptInvitationInput {
  invitationId: string
}

export interface DeclineInvitationInput {
  invitationId: string
}

export interface UpdateMemberRoleInput {
  workspaceId: WorkspaceId
  memberId: string
  role: 'owner' | 'member'
}

export interface RemoveMemberInput {
  workspaceId: WorkspaceId
  memberId: string
}

export interface UpdateWorkspaceInput {
  workspaceId: WorkspaceId
  name?: string
  icon?: string
}
