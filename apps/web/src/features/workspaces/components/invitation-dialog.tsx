import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { WorkspaceIcon } from "./workspace-icon";
import type { WorkspaceInvitation } from "../types";

interface InvitationDialogProps {
  invitation: WorkspaceInvitation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
  isResponding: boolean;
}

export function InvitationDialog({
  invitation,
  open,
  onOpenChange,
  onAccept,
  onDecline,
  isResponding,
}: InvitationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mb-2">
            <WorkspaceIcon
              icon={invitation.workspaceIcon}
              name={invitation.workspaceName}
              size="lg"
            />
          </div>
          <DialogTitle>Join {invitation.workspaceName}</DialogTitle>
          <DialogDescription>
            {invitation.invitedByName} invited you to join as{" "}
            {invitation.role}.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            disabled={isResponding}
            onClick={() => onDecline(invitation.id)}
          >
            Decline
          </Button>
          <Button disabled={isResponding} onClick={() => onAccept(invitation.id)}>
            Accept invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
