import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InviteMemberForm } from './invite-member-form'
import * as m from '@/paraglide/messages'

import type { WorkspaceId } from '../types'

interface InviteMemberDialogProps {
  workspaceId: WorkspaceId
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberDialog({
  workspaceId,
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{m.invite_dialog_title()}</DialogTitle>
          <DialogDescription>{m.invite_dialog_desc()}</DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          <InviteMemberForm
            workspaceId={workspaceId}
            onSuccess={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
