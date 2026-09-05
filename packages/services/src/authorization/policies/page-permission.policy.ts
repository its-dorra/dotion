import { allow, deny } from "@dotion/shared/authorization/decisions";
import { defineResourcePolicy } from "../policy";
import { isWorkspaceAdminOrOwnerPredicate } from "../predicates";

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

  update: ({ resource }) =>
    isWorkspaceAdminOrOwnerPredicate(resource.userWorkspaceRole),

  delete: ({ resource }) =>
    isWorkspaceAdminOrOwnerPredicate(resource.userWorkspaceRole),
});
