import { Button } from "@/components/ui/button";
import { NotificationRow } from "./notification-row";
import type { Notification } from "../types";

interface NotificationsListPresenterProps {
  notifications: Notification[];
  hasUnread: boolean;
  onRead: (notificationId: string) => void;
  onWorkspaceInvitationClick: (notification: Notification & { type: "workspace_invitation" }) => void;
  onGrantPageAccess: (notification: Notification & { type: "page_access_request" }) => void;
  isGrantingAccess: boolean;
  onMarkAllAsRead: () => void;
  isMarkingAllAsRead: boolean;
}

export function NotificationsListPresenter({
  notifications,
  hasUnread,
  onRead,
  onWorkspaceInvitationClick,
  onGrantPageAccess,
  isGrantingAccess,
  onMarkAllAsRead,
  isMarkingAllAsRead,
}: NotificationsListPresenterProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          Notifications
        </span>
        {hasUnread ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            disabled={isMarkingAllAsRead}
            onClick={onMarkAllAsRead}
          >
            Mark all as read
          </Button>
        ) : null}
      </div>
      <div className="space-y-0.5 p-1">
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onRead={onRead}
            onWorkspaceInvitationClick={onWorkspaceInvitationClick}
            onGrantPageAccess={onGrantPageAccess}
            isGrantingAccess={isGrantingAccess}
          />
        ))}
      </div>
    </div>
  );
}
