import { useIsMobile } from '@/hooks/use-mobile'
import { InvitationDialog } from './invitation-dialog'
import { InvitationDrawer } from './invitation-drawer'
import type { WorkspaceInvitation } from '../types'

interface InvitationResponseModalProps {
  invitation: WorkspaceInvitation
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvitationResponseModal(props: InvitationResponseModalProps) {
  const isMobile = useIsMobile()
  return isMobile ? (
    <InvitationDrawer {...props} />
  ) : (
    <InvitationDialog {...props} />
  )
}
