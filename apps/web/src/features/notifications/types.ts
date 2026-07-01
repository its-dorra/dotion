export type NotificationType =
  | "workspace_invitation"
  | "page_invitation"
  | "permission_change"
  | "mention"
  | "page_access_request";

export interface BaseNotification {
  id: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface WorkspaceInvitationNotification extends BaseNotification {
  type: "workspace_invitation";
  workspaceInvitationId: string;
  workspaceName: string;
  workspaceIcon?: string;
  invitedByName: string;
}

export interface PageInvitationNotification extends BaseNotification {
  type: "page_invitation";
  pageId: string;
  workspaceId: string;
  pageTitle: string;
  pageIcon?: string;
  invitedByName: string;
  role: "viewer" | "commenter" | "editor";
}

export interface PermissionChangeNotification extends BaseNotification {
  type: "permission_change";
  pageId: string;
  workspaceId: string;
  pageTitle: string;
  changedByName: string;
  newRole: "viewer" | "commenter" | "editor";
}

export interface MentionNotification extends BaseNotification {
  type: "mention";
  pageId: string;
  workspaceId: string;
  pageTitle: string;
  mentionedByName: string;
  excerpt: string;
}

export interface PageAccessRequestNotification extends BaseNotification {
  type: "page_access_request";
  pageId: string;
  workspaceId: string;
  pageTitle: string;
  requestedByName: string;
  requestedByEmail: string;
}

export type Notification =
  | WorkspaceInvitationNotification
  | PageInvitationNotification
  | PermissionChangeNotification
  | MentionNotification
  | PageAccessRequestNotification;

export interface MarkAsReadInput {
  notificationId: string;
}

export interface MarkAllAsReadInput {
  workspaceId?: string;
}
