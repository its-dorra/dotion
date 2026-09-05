import { allow, deny } from "@dotion/shared/authorization/decisions";
import { defineResourcePolicy } from "../policy";
import {
  isPageCommenterOrEditorPredicate,
  isPageViewerPredicate,
  isWorkspaceMemberPredicate,
} from "../predicates";

export const commentPolicy = defineResourcePolicy("comment", {
  create: ({ scope }) => {
    return isPageCommenterOrEditorPredicate(
      scope?.userWorkspaceRole,
      scope?.userPageRole,
    );
  },

  list: ({ scope }) => {
    return isWorkspaceMemberPredicate(scope?.userWorkspaceRole);
  },

  view: ({ resource }) => {
    return isPageViewerPredicate(
      resource.userWorkspaceRole,
      resource.userPageRole,
    );
  },

  update: ({ user, resource }) => {
    if (user.id === resource.authorId) {
      return allow("Author can update comment");
    }
    return deny("Only the author can update this comment");
  },

  resolve: ({ user, resource }) => {
    if (user.id === resource.authorId) {
      return allow("Author can resolve comment");
    }
    if (resource.userWorkspaceRole === "owner") {
      return allow("Workspace owner can resolve comment");
    }
    return deny("Only author or workspace owner can resolve this comment");
  },

  delete: ({ user, resource }) => {
    if (user.id === resource.authorId) {
      return allow("Author can delete comment");
    }
    if (resource.userWorkspaceRole === "owner") {
      return allow("Workspace owner can delete comment");
    }
    return deny("Only author or workspace owner can delete this comment");
  },
});
