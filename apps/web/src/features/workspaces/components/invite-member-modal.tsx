import { useIsMobile } from '@/lib/use-is-mobile'
import { InviteMemberDialog } from './invite-member-dialog'
import { InviteMemberSheet } from './invite-member-sheet'

interface InviteMemberModalProps {
  workspaceId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMemberModal(props: InviteMemberModalProps) {
  const isMobile = useIsMobile()
  return isMobile ? (
    <InviteMemberSheet {...props} />
  ) : (
    <InviteMemberDialog {...props} />
  )
}
