import { useIsMobile } from '@/hooks/use-mobile'
import { InviteMemberDialog } from './invite-member-dialog'
import { InviteMemberSheet } from './invite-member-sheet'

import type { WorkspaceId } from '../types'

interface InviteMemberModalProps {
  workspaceId: WorkspaceId
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
