import {
  allow,
  deny,
  type Decision,
} from "@dotion/shared/authorization/decisions";
import type { WorkspaceRole } from "@dotion/shared/workspaces/types";
import type { PagePermissionRole } from "@dotion/shared/pages/types";

export const isWorkspaceMemberPredicate = (
  userRole: WorkspaceRole | null,
): Decision => {
  return userRole != null
    ? allow("User is a workspace member")
    : deny("User is not a member of this workspace");
};

export const hasWorkspaceRolePredicate = (
  roles: WorkspaceRole[],
  userRole: WorkspaceRole | null,
): Decision => {
  if (!userRole) {
    return deny("User is not a member of this workspace");
  }
  if (roles.includes(userRole)) {
    return allow(`User has required workspace role: ${userRole}`);
  }
  return deny(`User lacks required workspace role (${roles.join(", ")})`);
};

export const isWorkspaceOwnerPredicate = (
  userRole: WorkspaceRole | null,
): Decision => {
  return hasWorkspaceRolePredicate(["owner"], userRole);
};

export const isPageEditorPredicate = (
  userWorkspaceRole: WorkspaceRole | null,
  userPageRole: PagePermissionRole | null,
): Decision => {
  if (userWorkspaceRole === "owner") {
    return allow("Workspace owner has full page edit access");
  }

  if (userPageRole === "editor") {
    return allow("User has explicit editor page permission");
  }

  return deny("User lacks page edit permission");
};

export const isPageCommenterOrEditorPredicate = (
  userWorkspaceRole: WorkspaceRole | null,
  userPageRole: PagePermissionRole | null,
): Decision => {
  if (userWorkspaceRole === "owner") {
    return allow("Workspace owner has full page comment access");
  }

  if (userPageRole === "editor" || userPageRole === "commenter") {
    return allow("User has page comment access");
  }

  return deny("User lacks page comment permission");
};

export const isPageViewerPredicate = (
  userWorkspaceRole: WorkspaceRole | null,
  userPageRole: PagePermissionRole | null,
): Decision => {
  if (userWorkspaceRole != null) {
    return allow("All workspace members have page view access");
  }

  if (userPageRole != null) {
    return allow("User has page access");
  }

  return deny("User does not have access to this page");
};
