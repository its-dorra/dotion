import { TaggedError } from "better-result";

export class WorkspaceNotFoundError extends TaggedError(
  "WorkspaceNotFoundError",
)<{
  message: string;
  workspaceId: string;
}>() {}

export class InvitationNotFoundError extends TaggedError(
  "InvitationNotFoundError",
)<{
  message: string;
  invitationId: string;
}>() {}

export class MemberAlreadyExistsError extends TaggedError(
  "MemberAlreadyExistsError",
)<{
  message: string;
  email: string;
}>() {}

export class CannotRemoveOwnerError extends TaggedError(
  "CannotRemoveOwnerError",
)<{
  message: string;
}>() {}

export class InsufficientWorkspacePermissionError extends TaggedError(
  "InsufficientWorkspacePermissionError",
)<{
  message: string;
  requiredRole: "owner" | "admin";
}>() {}
