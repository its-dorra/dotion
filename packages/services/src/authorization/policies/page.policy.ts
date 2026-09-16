import { deny } from "@dotion/shared/authorization/decisions";
import { defineResourcePolicy } from "@dotion/shared/authorization/policy";
import {
  isPageEditorPredicate,
  isPageViewerPredicate,
  isWorkspaceOwnerPredicate,
  isWorkspaceMemberPredicate,
} from "../predicates";

export const pagePolicy = defineResourcePolicy("page", {
  create: ({ container }) => {
    if (!container?.workspaceId) {
      return deny("Workspace ID is required to create a page");
    }
    return isWorkspaceOwnerPredicate(container.userWorkspaceRole);
  },

  list: ({ container }) => {
    if (!container?.workspaceId) {
      return deny("Workspace ID is required to list pages");
    }
    return isWorkspaceMemberPredicate(container.userWorkspaceRole);
  },

  listTrash: ({ container }) => {
    if (!container?.workspaceId) {
      return deny("Workspace ID is required to view trash");
    }
    return isWorkspaceMemberPredicate(container.userWorkspaceRole);
  },

  emptyTrash: ({ container }) => {
    if (!container?.workspaceId) {
      return deny("Workspace ID is required to empty trash");
    }
    return isWorkspaceOwnerPredicate(container.userWorkspaceRole);
  },

  view: ({ resource }) =>
    isPageViewerPredicate(resource.userWorkspaceRole, resource.userPageRole),

  update: ({ resource }) =>
    isPageEditorPredicate(resource.userWorkspaceRole, resource.userPageRole),

  delete: ({ resource }) =>
    isPageEditorPredicate(resource.userWorkspaceRole, resource.userPageRole),

  restore: ({ resource }) =>
    isPageEditorPredicate(resource.userWorkspaceRole, resource.userPageRole),

  deletePermanently: ({ resource }) =>
    isWorkspaceOwnerPredicate(resource.userWorkspaceRole),

  move: ({ resource }) => isWorkspaceOwnerPredicate(resource.userWorkspaceRole),

  managePermissions: ({ resource }) =>
    isWorkspaceOwnerPredicate(resource.userWorkspaceRole),

  share: ({ resource }) =>
    isWorkspaceOwnerPredicate(resource.userWorkspaceRole),
});
