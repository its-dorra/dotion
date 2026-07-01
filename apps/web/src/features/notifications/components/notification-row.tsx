import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { NotificationIcon } from "./notification-icon";
import { WorkspaceInvitationContent } from "./workspace-invitation-content";
import { PageInvitationContent } from "./page-invitation-content";
import { PermissionChangeContent } from "./permission-change-content";
import { MentionContent } from "./mention-content";
import { PageAccessRequestContent } from "./page-access-request-content";
import type { Notification } from "../types";

function formatRelativeTime(isoDate: string) {
  const diffMinutes = Math.round((Date.now() - new Date(isoDate).getTime()) / 60_000);
  if (diffMinutes < 1) return "now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
}

interface NotificationRowProps {
  notification: Notification;
  onRead: (notificationId: string) => void;
  onWorkspaceInvitationClick: (notification: Notification & { type: "workspace_invitation" }) => void;
  onGrantPageAccess: (notification: Notification & { type: "page_access_request" }) => void;
  isGrantingAccess: boolean;
}

export function NotificationRow({
  notification,
  onRead,
  onWorkspaceInvitationClick,
  onGrantPageAccess,
  isGrantingAccess,
}: NotificationRowProps) {
  const content = (() => {
    switch (notification.type) {
      case "workspace_invitation":
        return <WorkspaceInvitationContent notification={notification} />;
      case "page_invitation":
        return <PageInvitationContent notification={notification} />;
      case "permission_change":
        return <PermissionChangeContent notification={notification} />;
      case "mention":
        return <MentionContent notification={notification} />;
      case "page_access_request":
        return (
          <PageAccessRequestContent
            notification={notification}
            onGrantAccess={onGrantPageAccess}
            isGranting={isGrantingAccess}
          />
        );
    }
  })();

  const rowClasses = cn(
    "flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-accent",
    !notification.isRead && "bg-accent/40",
  );

  const inner = (
    <>
      <NotificationIcon type={notification.type} />
      <div className="min-w-0 flex-1">
        {content}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt)} ago
        </p>
      </div>
      {!notification.isRead ? (
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500"
          aria-label="Unread"
        />
      ) : null}
    </>
  );

  if (notification.type === "workspace_invitation") {
    return (
      <button
        type="button"
        onClick={() => onWorkspaceInvitationClick(notification)}
        className={cn(rowClasses, "w-full text-left")}
      >
        {inner}
      </button>
    );
  }

  // Every remaining notification type carries a pageId/workspaceId pair and
  // links directly to the page that triggered it.
  return (
    <Link
      to="/app/workspaces/$workspaceId/pages/$pageId"
      params={{ workspaceId: notification.workspaceId, pageId: notification.pageId }}
      onClick={() => onRead(notification.id)}
      className={rowClasses}
    >
      {inner}
    </Link>
  );
}
