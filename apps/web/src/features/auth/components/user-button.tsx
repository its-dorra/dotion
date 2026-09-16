import { Link } from '@tanstack/react-router'
import {
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Download,
} from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { PwaInstallDialog } from '@/components/pwa/pwa-install-dialog'
import type { User } from '../types'
import { useSignOut } from '../hooks/use-sign-out'
import { m } from '@/paraglide/messages'

type UserButtonProps = {
  user: User
}

export function UserButton({ user }: UserButtonProps) {
  const signOutMutation = useSignOut()
  const {
    canInstall,
    isInstalled,
    isIos,
    promptInstall,
    showIosGuide,
    setShowIosGuide,
  } = usePwaInstall()

  const showInstall = !isInstalled && (canInstall || isIos)

  const initials = user.name
    .split(' ')
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="size-9 rounded-full p-0"
            aria-label={m.auth_user_menu()}
          >
            <Avatar className="size-9">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{user.name}</span>

                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link to="/app/profile">
              <UserIcon />
              {m.auth_profile()}
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link to="/app">
              <LayoutDashboard />
              {m.auth_app()}
            </Link>
          </DropdownMenuItem>

          {showInstall ? (
            <DropdownMenuItem onSelect={() => void promptInstall()}>
              <Download />
              {m.pwa_install_app()}
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            onSelect={() => signOutMutation.mutateAsync()}
          >
            <LogOut />
            {m.auth_sign_out()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PwaInstallDialog open={showIosGuide} onOpenChange={setShowIosGuide} />
    </>
  )
}
