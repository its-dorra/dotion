import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsListQueryOptions } from "../query-options";
import { useMarkAsRead } from "../hooks/use-mark-as-read";
import { useMarkAllAsRead } from "../hooks/use-mark-all-as-read";
import { NotificationsListPresenter } from "./notifications-list-presenter";
import { NotificationsLoading } from "./notifications-loading";
import { NotificationsError } from "./notifications-error";
import { NotificationsEmpty } from "./notifications-empty";
import {
  pendingInvitationsQueryOptions,
  InvitationResponseModal,
  useAcceptInvitation,
  useDeclineInvitation,
} from "@/features/workspaces";
import { pageDetailQueryOptions, useInviteToPage } from "@/features/pages";
import type { Notification } from "../types";

export function NotificationsContainer() {
  const [activeInvitationId, setActiveInvitationId] = useState<string | null>(
    null,
  );
  const [grantingNotificationId, setGrantingNotificationId] = useState<
    string | null
  >(null);

  const queryClient = useQueryClient();
  const notificationsQuery = useQuery(notificationsListQueryOptions());
  // Needed to resolve a workspace_invitation notification into the full
  // WorkspaceInvitation object the response modal renders.
  const invitationsQuery = useQuery(pendingInvitationsQueryOptions());

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();
  const inviteToPage = useInviteToPage();

  if (notificationsQuery.isPending) {
    return <NotificationsLoading />;
  }

  if (notificationsQuery.isError) {
    return (
      <NotificationsError
        message={notificationsQuery.error.message}
        onRetry={() => notificationsQuery.refetch()}
      />
    );
  }

  const notifications = notificationsQuery.data;

  if (notifications.length === 0) {
    return <NotificationsEmpty />;
  }

  const activeInvitation = invitationsQuery.data?.find(
    (invitation) => invitation.id === activeInvitationId,
  );

  function handleRead(notificationId: string) {
    markAsRead.mutate(notificationId, {
      onError: (error) => toast.error(error.message),
    });
  }

  function handleWorkspaceInvitationClick(
    notification: Notification & { type: "workspace_invitation" },
  ) {
    handleRead(notification.id);
    setActiveInvitationId(notification.workspaceInvitationId);
  }

  async function handleGrantPageAccess(
    notification: Notification & { type: "page_access_request" },
  ) {
    setGrantingNotificationId(notification.id);
    try {
      // The acting user's role is page-specific and isn't loaded in the
      // notifications view, so it's fetched on demand for just this page
      // rather than subscribed to — a one-off read, not live state this
      // component needs to track.
      const page = await queryClient.fetchQuery(
        pageDetailQueryOptions(notification.pageId),
      );

      inviteToPage.mutate(
        {
          pageId: notification.pageId,
          email: notification.requestedByEmail,
          role: "editor",
          actingUserRole: page.currentUserRole,
        },
        {
          onSuccess: () => {
            toast.success(`${notification.requestedByName} now has access`);
            handleRead(notification.id);
          },
          onError: (error) => toast.error(error.message),
          onSettled: () => setGrantingNotificationId(null),
        },
      );
    } catch {
      toast.error("Couldn't grant access right now.");
      setGrantingNotificationId(null);
    }
  }

  function handleMarkAllAsRead() {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => toast.success("All notifications marked as read"),
      onError: (error) => toast.error(error.message),
    });
  }

  function handleAccept(invitationId: string) {
    acceptInvitation.mutate(
      { invitationId },
      {
        onSuccess: (workspace) => {
          toast.success(`You've joined ${workspace.name}`);
          setActiveInvitationId(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleDecline(invitationId: string) {
    declineInvitation.mutate(
      { invitationId },
      {
        onSuccess: () => {
          toast.success("Invitation declined");
          setActiveInvitationId(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <>
      <NotificationsListPresenter
        notifications={notifications}
        hasUnread={notifications.some((n) => !n.isRead)}
        onRead={handleRead}
        onWorkspaceInvitationClick={handleWorkspaceInvitationClick}
        onGrantPageAccess={handleGrantPageAccess}
        isGrantingAccess={grantingNotificationId !== null}
        onMarkAllAsRead={handleMarkAllAsRead}
        isMarkingAllAsRead={markAllAsRead.isPending}
      />
      {activeInvitation ? (
        <InvitationResponseModal
          invitation={activeInvitation}
          open={Boolean(activeInvitationId)}
          onOpenChange={(open) => {
            if (!open) setActiveInvitationId(null);
          }}
          onAccept={handleAccept}
          onDecline={handleDecline}
          isResponding={acceptInvitation.isPending || declineInvitation.isPending}
        />
      ) : null}
    </>
  );
}
