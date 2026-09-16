import { allow } from "@dotion/shared/authorization/decisions";
import { defineResourcePolicy } from "@dotion/shared/authorization/policy";
import {
  isWorkspaceMemberPredicate,
  isWorkspaceOwnerPredicate,
} from "../predicates";

export const workspacePolicy = defineResourcePolicy("workspace", {
  create: () => allow("Authenticated user can create a workspace"),
  list: () => allow("Authenticated user can list their workspaces"),

  view: ({ resource }) => isWorkspaceMemberPredicate(resource.userRole),

  update: ({ resource }) => isWorkspaceOwnerPredicate(resource.userRole),

  delete: ({ resource }) => isWorkspaceOwnerPredicate(resource.userRole),

  inviteMember: ({ resource }) => isWorkspaceOwnerPredicate(resource.userRole),

  manageSettings: ({ resource }) =>
    isWorkspaceOwnerPredicate(resource.userRole),
});
