import { Link } from '@tanstack/react-router'
import { LogOut, User as UserIcon, Building2, Download } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePwaInstall } from '@/hooks/use-pwa-install'
import { PwaInstallDialog } from '@/components/pwa/pwa-install-dialog'
import * as m from '@/paraglide/messages'
import type { User } from '../types'

interface UserMenuPresenterProps {
  user: User
  currentWorkspaceId?: string
  onLogout: () => void
  isLogingOut?: boolean
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function UserMenuPresenter({
  user,
  currentWorkspaceId,
  onLogout,
  isLogingOut,
}: UserMenuPresenterProps) {
  const {
    canInstall,
    isInstalled,
    isIos,
    promptInstall,
    showIosGuide,
    setShowIosGuide,
  } = usePwaInstall()

  const showInstall = !isInstalled && (canInstall || isIos)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isLogingOut}
          >
            <Avatar>
              {user.image && <AvatarImage src={user.image} alt={user.name} />}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="truncate text-xs text-muted-foreground">
            {user.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/app/profile" className="gap-2">
              <UserIcon className="h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          {currentWorkspaceId ? (
            <DropdownMenuItem asChild>
              <Link
                to="/app/workspaces/$workspaceId/settings"
                params={{ workspaceId: currentWorkspaceId }}
                className="gap-2"
              >
                <Building2 className="h-4 w-4" />
                Workspace settings
              </Link>
            </DropdownMenuItem>
          ) : null}
          {showInstall ? (
            <DropdownMenuItem
              onSelect={() => void promptInstall()}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {m.pwa_install_app()}
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={onLogout}
            className="gap-2 text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PwaInstallDialog open={showIosGuide} onOpenChange={setShowIosGuide} />
    </>
  )
}
