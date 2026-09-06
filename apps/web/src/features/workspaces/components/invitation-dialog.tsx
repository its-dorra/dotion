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
import { useAcceptInvitation } from '../hooks/use-accept-invitation'
import { useDeclineInvitation } from '../hooks/use-decline-invitation'
import type { WorkspaceInvitation } from '../types'
import * as m from '@/paraglide/messages'

interface InvitationDialogProps {
  invitation: WorkspaceInvitation
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvitationDialog({
  invitation,
  open,
  onOpenChange,
}: InvitationDialogProps) {
  const acceptInvitation = useAcceptInvitation()
  const declineInvitation = useDeclineInvitation()

  const isResponding = acceptInvitation.isPending || declineInvitation.isPending

  async function handleAccept() {
    await acceptInvitation.mutateAsync({ invitationId: invitation.id })
    onOpenChange(false)
  }

  async function handleDecline() {
    await declineInvitation.mutateAsync({ invitationId: invitation.id })
    onOpenChange(false)
  }

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
            onClick={handleDecline}
          >
            {m.invitation_decline()}
          </Button>
          <Button disabled={isResponding} onClick={handleAccept}>
            {m.invitation_accept_invitation()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
