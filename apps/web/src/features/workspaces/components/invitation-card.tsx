import { WorkspaceIcon } from "./workspace-icon";
import { Button } from "@/components/ui/button";
import type { WorkspaceInvitation } from "../types";

interface InvitationCardProps {
  invitation: WorkspaceInvitation;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
  isResponding: boolean;
}

export function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  isResponding,
}: InvitationCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <WorkspaceIcon icon={invitation.workspaceIcon} name={invitation.workspaceName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {invitation.workspaceName}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {invitation.invitedByName} invited you as {invitation.role}
        </p>
      </div>
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={isResponding}
          onClick={() => onDecline(invitation.id)}
        >
          Decline
        </Button>
        <Button
          size="sm"
          disabled={isResponding}
          onClick={() => onAccept(invitation.id)}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
