import { UserMenuPresenter } from './user-menu-presenter'
import { useSession } from '../hooks/use-session'

interface UserMenuContainerProps {
  currentWorkspaceId?: string
}

export function UserMenuContainer({
  currentWorkspaceId,
}: UserMenuContainerProps) {
  const query = useSession()

  if (!query.data || !query.data.user) {
    return null
  }

  return (
    <UserMenuPresenter
      user={query.data.user}
      currentWorkspaceId={currentWorkspaceId}
    />
  )
}
