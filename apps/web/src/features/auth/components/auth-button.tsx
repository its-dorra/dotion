import { useSession } from '../hooks/use-session'

import AuthPopover from './auth-popover'
import { UserButton } from './user-button'

export default function AuthButton() {
  const session = useSession()
  const user = session.data?.user

  if (!user) {
    return <AuthPopover />
  }

  return <UserButton user={user} />
}
