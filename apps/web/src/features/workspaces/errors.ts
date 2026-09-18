import { TaggedError } from 'better-result'
import type { WorkspaceId } from './types'

export class WorkspaceNotFoundError extends TaggedError(
  'WorkspaceNotFoundError',
)<{
  message: string
  workspaceId: WorkspaceId
}> {}

export class InvitationNotFoundError extends TaggedError(
  'InvitationNotFoundError',
)<{
  message: string
  invitationId: string
}> {}

export class MemberAlreadyExistsError extends TaggedError(
  'MemberAlreadyExistsError',
)<{
  message: string
  email: string
}> {}

export class CannotRemoveOwnerError extends TaggedError(
  'CannotRemoveOwnerError',
)<{
  message: string
}> {}

export class InsufficientWorkspacePermissionError extends TaggedError(
  'InsufficientWorkspacePermissionError',
)<{
  message: string
  requiredRole: 'owner' | 'member'
}> {}
