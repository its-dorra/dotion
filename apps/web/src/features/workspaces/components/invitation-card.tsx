import { WorkspaceIcon } from './workspace-icon'
import { Button } from '@/components/ui/button'
import type { WorkspaceInvitation } from '../types'
import * as m from '@/paraglide/messages'

interface InvitationCardProps {
  invitation: WorkspaceInvitation
  onAccept: (invitationId: string) => void
  onDecline: (invitationId: string) => void
  isResponding: boolean
}

export function InvitationCard({
  invitation,
  onAccept,
  onDecline,
  isResponding,
}: InvitationCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3">
      <WorkspaceIcon
        icon={invitation.workspaceIcon ?? undefined}
        name={invitation.workspaceName}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {invitation.workspaceName}
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {m.invitation_card_invited_by({
            invitedByName: invitation.invitedByName,
          })}
        </p>
      </div>
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="outline"
          disabled={isResponding}
          onClick={() => onDecline(invitation.id)}
        >
          {m.invitation_decline()}
        </Button>
        <Button
          size="sm"
          disabled={isResponding}
          onClick={() => onAccept(invitation.id)}
        >
          {m.invitation_accept()}
        </Button>
      </div>
    </div>
  )
}
