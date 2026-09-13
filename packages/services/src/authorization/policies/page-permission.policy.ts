import { allow, deny } from "@dotion/shared/authorization/decisions";
import { defineResourcePolicy } from "../policy";

export const pagePermissionPolicy = defineResourcePolicy("pagePermission", {
  list: ({ scope }) => {
    if (!scope?.pageId) return deny("Page ID is required to list permissions");
    return scope.userWorkspaceRole != null
      ? allow("Workspace members can view page permissions")
      : deny("Must be a workspace member to view page permissions");
  },

  view: ({ resource }) => {
    return resource.userWorkspaceRole != null
      ? allow("Workspace members can view page permission")
      : deny("Must be a workspace member to view page permission");
  },

  update: ({ resource }) => {
    if (resource.userWorkspaceRole !== "owner") {
      return deny("Only workspace owner can update page permissions");
    }
    if (resource.targetUserWorkspaceRole === "owner") {
      return deny("Cannot change workspace owner's page permission");
    }
    return allow("Workspace owner can update page permissions");
  },

  delete: ({ resource }) => {
    if (resource.userWorkspaceRole !== "owner") {
      return deny("Only workspace owner can delete page permissions");
    }
    if (resource.targetUserWorkspaceRole === "owner") {
      return deny("Cannot delete workspace owner's page permission");
    }
    return allow("Workspace owner can delete page permissions");
  },
});
