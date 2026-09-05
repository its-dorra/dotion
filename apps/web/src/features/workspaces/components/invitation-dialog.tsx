import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WorkspaceIcon } from './workspace-icon'
import type { WorkspaceInvitation } from '../types'
import * as m from '@/paraglide/messages'

interface InvitationDialogProps {
  invitation: WorkspaceInvitation
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept: (invitationId: string) => void
  onDecline: (invitationId: string) => void
  isResponding: boolean
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
              icon={invitation.workspaceIcon ?? undefined}
              name={invitation.workspaceName}
              size="lg"
            />
          </div>
          <DialogTitle>
            {m.invitation_dialog_join({
              workspaceName: invitation.workspaceName,
            })}
          </DialogTitle>
          <DialogDescription>
            {m.invitation_dialog_desc({
              invitedByName: invitation.invitedByName,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            disabled={isResponding}
            onClick={() => onDecline(invitation.id)}
          >
            {m.invitation_decline()}
          </Button>
          <Button
            disabled={isResponding}
            onClick={() => onAccept(invitation.id)}
          >
            {m.invitation_accept_invitation()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
