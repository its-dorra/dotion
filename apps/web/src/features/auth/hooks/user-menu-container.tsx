import { UserMenuPresenter } from './user-menu-presenter'
import { useSignOut } from './use-sign-out'
import { useSession } from './use-session'

interface UserMenuContainerProps {
  currentWorkspaceId?: string
}

export function UserMenuContainer({
  currentWorkspaceId,
}: UserMenuContainerProps) {
  const query = useSession()
  const signOutMutation = useSignOut()

  if (!query.data || !query.data.user) {
    return null
  }

  function handleLogout() {
    return signOutMutation.mutateAsync()
  }

  return (
    <UserMenuPresenter
      user={query.data.user}
      currentWorkspaceId={currentWorkspaceId}
      onLogout={handleLogout}
      isLogingOut={signOutMutation.isPending}
    />
  )
}
