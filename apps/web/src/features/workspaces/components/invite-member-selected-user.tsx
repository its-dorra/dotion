import { X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { UserSearchResult } from '../types'
import * as m from '@/paraglide/messages'

interface InviteMemberSelectedUserProps {
  user: UserSearchResult
  onClear: () => void
}

export function InviteMemberSelectedUser({
  user,
  onClear,
}: InviteMemberSelectedUserProps) {
  return (
    <div className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar className="h-10 w-10 shrink-0 border border-primary/30">
          {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {user.name?.slice(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <span title={user.name} className="truncate text-sm font-medium text-foreground">
              {user.name}
            </span>
            <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
              {m.workspace_role_member()}
            </Badge>
          </div>
          <span title={user.email} className="block truncate text-xs text-muted-foreground">
            {user.email}
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-8 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <X className="mr-1 h-3.5 w-3.5" />
        {m.invite_form_change()}
      </Button>
    </div>
  )
}
