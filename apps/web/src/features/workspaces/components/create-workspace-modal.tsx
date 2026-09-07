import { useIsMobile } from '@/hooks/use-mobile'
import { CreateWorkspaceDialog } from './create-workspace-dialog'
import { CreateWorkspaceDrawer } from './create-workspace-drawer'

interface CreateWorkspaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateWorkspaceModal(props: CreateWorkspaceModalProps) {
  const isMobile = useIsMobile()
  return isMobile ? (
    <CreateWorkspaceDrawer {...props} />
  ) : (
    <CreateWorkspaceDialog {...props} />
  )
}
