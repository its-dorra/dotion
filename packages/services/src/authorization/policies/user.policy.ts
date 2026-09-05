import { allow, deny } from "@dotion/shared/authorization/decisions";
import { defineResourcePolicy } from "../policy";

export const userPolicy = defineResourcePolicy("user", {
  list: () => allow("Authenticated users can search/list users"),

  view: () => allow("Authenticated users can view profiles"),

  update: ({ user, resource }) => {
    if (user.id === resource.targetUserId) {
      return allow("Users can update their own profile");
    }
    return deny("Users cannot update other users' profiles");
  },

  delete: ({ user, resource }) => {
    if (user.id === resource.targetUserId) {
      return allow("Users can delete their own account");
    }
    return deny("Users cannot delete other users' accounts");
  },
});
