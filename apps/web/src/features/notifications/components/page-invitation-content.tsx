import type { PageInvitationNotification } from "../types";

export function PageInvitationContent({
  notification,
}: {
  notification: PageInvitationNotification;
}) {
  return (
    <p className="text-sm">
      <span className="font-medium">{notification.invitedByName}</span>{" "}
      invited you to{" "}
      <span className="font-medium">{notification.pageTitle}</span> as{" "}
      {notification.role}
    </p>
  );
}
