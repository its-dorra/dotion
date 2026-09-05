import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { InviteMemberForm } from './invite-member-form'
import * as m from '@/paraglide/messages'

interface InviteMemberSheetProps {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberSheet({
  workspaceId,
  open,
  onOpenChange,
}: InviteMemberSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-6"
      >
        <SheetHeader className="mb-4 p-0 text-left">
          <SheetTitle>{m.invite_dialog_title()}</SheetTitle>
          <SheetDescription>{m.invite_dialog_desc()}</SheetDescription>
        </SheetHeader>

        <div className="mt-2">
          <InviteMemberForm
            workspaceId={workspaceId}
            onSuccess={() => onOpenChange(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
