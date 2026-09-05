import { allow, deny } from "@dotion/shared/authorization/decisions";
import { defineResourcePolicy } from "../policy";

export const workspaceMemberPolicy = defineResourcePolicy("workspaceMember", {
  list: ({ scope }) => {
    if (!scope?.workspaceId) {
      return deny("Workspace ID is required to list members");
    }
    return scope.userRole != null
      ? allow("Workspace members can view member list")
      : deny("Must be a workspace member to list members");
  },

  view: ({ resource }) => {
    return resource.userRole != null
      ? allow("Workspace members can view member details")
      : deny("Must be a workspace member to view member details");
  },

  updateRole: ({ resource }) => {
    if (resource.userRole !== "owner") {
      return deny("Only workspace owner can update member roles");
    }
    if (resource.targetRole === "owner") {
      return deny("Cannot change the owner's role");
    }
    return allow("Workspace owner can update member roles");
  },

  remove: ({ user, resource }) => {
    if (resource.targetRole === "owner") {
      return deny("Cannot remove workspace owner");
    }

    if (user.id === resource.targetUserId) {
      return allow("Users can leave workspace");
    }

    if (resource.userRole === "owner") {
      return allow("Owner can remove any member");
    }

    return deny("Insufficient permissions to remove member");
  },
});
