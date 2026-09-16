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

import type { WorkspaceInvitationId } from '@dotion/shared/ids'

export type {
  WorkspaceId,
  Workspace,
  CreateWorkspaceInput,
  WorkspaceWsMessage,
  WorkspaceMemberDetail,
  WorkspaceInvitationWithDetails,
  PaginatedData,
  UserSearchResult,
  WorkspaceInvitationId,
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
  invitationId: WorkspaceInvitationId
}

export interface DeclineInvitationInput {
  invitationId: WorkspaceInvitationId
}

export interface UpdateMemberRoleInput {
  workspaceId: WorkspaceId
  memberId: UserId
  role: 'owner' | 'member'
}

export interface RemoveMemberInput {
  workspaceId: WorkspaceId
  memberId: UserId
}

export interface UpdateWorkspaceInput {
  workspaceId: WorkspaceId
  name?: string
  icon?: string
}
