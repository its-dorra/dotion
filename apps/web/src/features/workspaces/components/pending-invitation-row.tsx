import { Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Can } from '@/features/authorization/components/can'
import { useCancelWorkspaceInvitation } from '../hooks/use-cancel-workspace-invitation'
import * as m from '@/paraglide/messages'
import type { WorkspaceInvitation } from '../types'
import type { WorkspaceInvitationId } from '@dotion/shared/workspaces/types'

interface PendingInvitationRowProps {
  invitation: WorkspaceInvitation
  canManage: boolean
}

export function PendingInvitationRow({
  invitation,
  canManage: _canManage,
}: PendingInvitationRowProps) {
  const cancelInvitation = useCancelWorkspaceInvitation()

  const displayName =
    invitation.invitedUserName ||
    invitation.invitedUserEmail ||
    m.invitation_invited_user()
  const initials = displayName.slice(0, 2).toUpperCase()

  async function handleCancel() {
    await cancelInvitation.mutateAsync({
      workspaceId: invitation.workspaceId,
      invitationId: invitation.id,
    })
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar className="h-9 w-9 border border-dashed border-muted-foreground/40">
        <AvatarFallback className="bg-muted/50 text-xs font-medium text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[11px] font-normal text-amber-700 dark:text-amber-400"
          >
            <Clock className="h-3 w-3" />
            {m.invitation_pending()}
          </Badge>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {invitation.invitedUserEmail}{' '}
          {invitation.invitedByName ? (
            <span className="text-muted-foreground/70">
              {m.invitation_invited_by({ name: invitation.invitedByName })}
            </span>
          ) : null}
        </p>
      </div>

      <Can
        resource={{
          type: 'workspaceInvitation',
          id: {
            invitationId: invitation.id as WorkspaceInvitationId,
          },
        }}
        action="cancel"
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={cancelInvitation.isPending}
          onClick={handleCancel}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
          {m.invitation_cancel()}
        </Button>
      </Can>
    </div>
  )
}
