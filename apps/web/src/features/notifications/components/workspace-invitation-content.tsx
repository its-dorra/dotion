import type { WorkspaceInvitationNotification } from "../types";

export function WorkspaceInvitationContent({
  notification,
}: {
  notification: WorkspaceInvitationNotification;
}) {
  return (
    <p className="text-sm">
      <span className="font-medium">{notification.invitedByName}</span>{" "}
      invited you to join{" "}
      <span className="font-medium">{notification.workspaceName}</span>
    </p>
  );
}
