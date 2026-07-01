// Components consumed outside the workspaces feature
export { WorkspaceSwitcherContainer } from "./components/workspace-switcher-container";
export { WorkspaceSelectionContainer } from "./components/workspace-selection-container";
export { WorkspaceSettingsContainer } from "./components/workspace-settings-container";
export { MembersContainer } from "./components/members-container";
export { InvitationsContainer } from "./components/invitations-container";
export { InvitationResponseModal } from "./components/invitation-response-modal";
export { WorkspaceIcon } from "./components/workspace-icon";
export { MemberAvatar } from "./components/member-avatar";
export { RoleBadge } from "./components/role-badge";

// Mutation hooks consumed outside the workspaces feature (e.g. notifications)
export { useAcceptInvitation } from "./hooks/use-accept-invitation";
export { useDeclineInvitation } from "./hooks/use-decline-invitation";

// Query options / keys consumed by other features (e.g. pages, AI assistant)
export {
  workspacesKeys,
  workspacesListQueryOptions,
  workspaceDetailQueryOptions,
  workspaceMembersQueryOptions,
  pendingInvitationsQueryOptions,
} from "./query-options";

export type {
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
  WorkspaceInvitation,
  InvitationStatus,
} from "./types";
