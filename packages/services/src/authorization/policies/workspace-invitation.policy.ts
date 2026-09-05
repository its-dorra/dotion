import { allow, deny } from "@dotion/shared/authorization/decisions";
import { defineResourcePolicy } from "../policy";

export const workspaceInvitationPolicy = defineResourcePolicy(
  "workspaceInvitation",
  {
    list: ({ scope }) => {
      if (!scope?.workspaceId) {
        return deny("Workspace ID is required to list invitations");
      }
      if (scope.userRole === "owner") {
        return allow("Workspace owner can list invitations");
      }
      return deny("Only workspace owner can list invitations");
    },

    view: ({ user, resource }) => {
      if (user.id === resource.invitedUserId) {
        return allow("Invited user can view invitation");
      }
      if (resource.userRole === "owner") {
        return allow("Workspace owner can view invitation");
      }
      return deny("Not authorized to view invitation");
    },

    accept: ({ user, resource }) => {
      if (user.id === resource.invitedUserId) {
        return allow("Invited user can accept invitation");
      }
      return deny("Only the invited user can accept this invitation");
    },

    decline: ({ user, resource }) => {
      if (user.id === resource.invitedUserId) {
        return allow("Invited user can decline invitation");
      }
      return deny("Only the invited user can decline this invitation");
    },

    cancel: ({ user, resource }) => {
      if (user.id === resource.invitedByUserId) {
        return allow("Inviter can cancel invitation");
      }
      if (resource.userRole === "owner") {
        return allow("Workspace owner can cancel invitation");
      }
      return deny("Only inviter or workspace owner can cancel this invitation");
    },
  },
);
