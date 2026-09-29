import { defineRelations } from "drizzle-orm";
import * as schema from "./";

export const relations = defineRelations(schema, (r) => ({
  users: {
    accounts: r.many.accounts(),
    workspaces: r.many.workspaceMembers(),
    verifications: r.many.verifications(),
    comments: r.many.comments(),
    notifications: r.many.notifications(),
    receivedInvitations: r.many.workspaceInvitations({
      alias: "receivedInvitations",
    }),
    sentInvitations: r.many.workspaceInvitations({
      alias: "sentInvitations",
    }),
  },
  accounts: {
    users: r.one.users({
      from: r.accounts.userId,
      to: r.users.id,
    }),
  },
  verifications: {
    users: r.one.users({
      from: r.verifications.identifier,
      to: r.users.email,
    }),
  },
  workspaces: {
    members: r.many.workspaceMembers(),
    pages: r.many.pages(),
    invitations: r.many.workspaceInvitations(),
  },
  comments: {
    page: r.one.pages({
      from: r.comments.pageId,
      to: r.pages.id,
    }),
    parent: r.one.comments({
      from: r.comments.parentId,
      to: r.comments.id,
    }),
    replies: r.many.comments(),
    author: r.one.users({
      from: r.comments.authorId,
      to: r.users.id,
    }),
  },
  workspaceMembers: {
    workspace: r.one.workspaces({
      from: r.workspaceMembers.workspaceId,
      to: r.workspaces.id,
    }),
    user: r.one.users({
      from: r.workspaceMembers.userId,
      to: r.users.id,
    }),
    pagePermissions: r.many.pagePermissions(),
  },
  workspaceInvitations: {
    workspace: r.one.workspaces({
      from: r.workspaceInvitations.workspaceId,
      to: r.workspaces.id,
    }),
    invitedUser: r.one.users({
      from: r.workspaceInvitations.invitedUserId,
      to: r.users.id,
      alias: "receivedInvitations",
    }),
    invitedByUser: r.one.users({
      from: r.workspaceInvitations.invitedByUserId,
      to: r.users.id,
      alias: "sentInvitations",
    }),
  },
  notifications: {
    user: r.one.users({
      from: r.notifications.userId,
      to: r.users.id,
    }),
  },
  pages: {
    workspace: r.one.workspaces({
      from: r.pages.workspaceId,
      to: r.workspaces.id,
    }),
    parent: r.one.pages({
      from: r.pages.parentId,
      to: r.pages.id,
    }),
    pagePermissions: r.many.pagePermissions(),
    comments: r.many.comments(),
    accessRequests: r.many.pageAccessRequests(),
  },
  pagePermissions: {
    page: r.one.pages({
      from: r.pagePermissions.pageId,
      to: r.pages.id,
    }),
    member: r.one.workspaceMembers({
      from: [r.pagePermissions.workspaceId, r.pagePermissions.userId],
      to: [r.workspaceMembers.workspaceId, r.workspaceMembers.userId],
    }),
  },
  pageAccessRequests: {
    page: r.one.pages({
      from: r.pageAccessRequests.pageId,
      to: r.pages.id,
    }),
    workspace: r.one.workspaces({
      from: r.pageAccessRequests.workspaceId,
      to: r.workspaces.id,
    }),
    member: r.one.workspaceMembers({
      from: [r.pageAccessRequests.workspaceId, r.pageAccessRequests.userId],
      to: [r.workspaceMembers.workspaceId, r.workspaceMembers.userId],
    }),
  },
}));
