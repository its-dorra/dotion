import { InvitationCard } from "./invitation-card";
import type { WorkspaceInvitation } from "../types";

interface InvitationsListPresenterProps {
  invitations: WorkspaceInvitation[];
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
  respondingInvitationId?: string;
}

export function InvitationsListPresenter({
  invitations,
  onAccept,
  onDecline,
  respondingInvitationId,
}: InvitationsListPresenterProps) {
  return (
    <div className="space-y-2">
      {invitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          onAccept={onAccept}
          onDecline={onDecline}
          isResponding={respondingInvitationId === invitation.id}
        />
      ))}
    </div>
  );
}
