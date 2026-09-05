import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { WorkspaceIcon } from './workspace-icon'
import type { WorkspaceInvitation } from '../types'
import * as m from '@/paraglide/messages'

interface InvitationDrawerProps {
  invitation: WorkspaceInvitation
  open: boolean
  onOpenChange: (open: boolean) => void
  onAccept: (invitationId: string) => void
  onDecline: (invitationId: string) => void
  isResponding: boolean
}

export function InvitationDrawer({
  invitation,
  open,
  onOpenChange,
  onAccept,
  onDecline,
  isResponding,
}: InvitationDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <div className="mb-2">
            <WorkspaceIcon
              icon={invitation.workspaceIcon ?? undefined}
              name={invitation.workspaceName}
              size="lg"
            />
          </div>
          <DrawerTitle>
            {m.invitation_dialog_join({
              workspaceName: invitation.workspaceName,
            })}
          </DrawerTitle>
          <DrawerDescription>
            {m.invitation_dialog_desc({
              invitedByName: invitation.invitedByName,
            })}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex-row gap-2">
          <Button
            variant="outline"
            className="flex-1"
            disabled={isResponding}
            onClick={() => onDecline(invitation.id)}
          >
            {m.invitation_decline()}
          </Button>
          <Button
            className="flex-1"
            disabled={isResponding}
            onClick={() => onAccept(invitation.id)}
          >
            {m.invitation_accept()}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
