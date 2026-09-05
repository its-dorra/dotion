import { deny } from "@dotion/shared/authorization/decisions";
import { defineResourcePolicy } from "../policy";
import {
  isPageEditorPredicate,
  isPageViewerPredicate,
  isWorkspaceOwnerPredicate,
  isWorkspaceMemberPredicate,
} from "../predicates";

export const pagePolicy = defineResourcePolicy("page", {
  create: ({ scope }) => {
    if (!scope?.workspaceId) {
      return deny("Workspace ID is required to create a page");
    }
    return isWorkspaceOwnerPredicate(scope.userWorkspaceRole);
  },

  list: ({ scope }) => {
    if (!scope?.workspaceId) {
      return deny("Workspace ID is required to list pages");
    }
    return isWorkspaceMemberPredicate(scope.userWorkspaceRole);
  },

  listTrash: ({ scope }) => {
    if (!scope?.workspaceId) {
      return deny("Workspace ID is required to view trash");
    }
    return isWorkspaceMemberPredicate(scope.userWorkspaceRole);
  },

  view: ({ resource }) =>
    isPageViewerPredicate(resource.userWorkspaceRole, resource.userPageRole),

  update: ({ resource }) =>
    isPageEditorPredicate(resource.userWorkspaceRole, resource.userPageRole),

  delete: ({ resource }) =>
    isWorkspaceOwnerPredicate(resource.userWorkspaceRole),

  restore: ({ resource }) =>
    isWorkspaceOwnerPredicate(resource.userWorkspaceRole),

  move: ({ resource }) =>
    isWorkspaceOwnerPredicate(resource.userWorkspaceRole),

  managePermissions: ({ resource }) =>
    isWorkspaceOwnerPredicate(resource.userWorkspaceRole),

  share: ({ resource }) =>
    isWorkspaceOwnerPredicate(resource.userWorkspaceRole),
});
