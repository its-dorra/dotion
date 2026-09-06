import { MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MemberAvatar } from './member-avatar'
import { RoleBadge } from './role-badge'
import { Can } from '@/features/authorization/components/can'
import { useRemoveMember } from '../hooks/use-remove-member'
import type { WorkspaceMember, WorkspaceId } from '../types'
import type { UserId } from '@dotion/shared/users/types'
import * as m from '@/paraglide/messages'

interface MemberRowProps {
  workspaceId: string
  member: WorkspaceMember
  canManage: boolean
}

export function MemberRow({
  workspaceId,
  member,
  canManage: _canManage,
}: MemberRowProps) {
  const removeMember = useRemoveMember()

  async function handleRemove() {
    await removeMember.mutateAsync({
      workspaceId: workspaceId as WorkspaceId,
      memberId: (member.userId ?? member.id) as UserId,
    })
  }

  return (
    <div className="flex items-center gap-3 py-2.5">
      <MemberAvatar name={member.name} avatarUrl={member.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-sm text-muted-foreground">{member.email}</p>
      </div>
      <RoleBadge role={member.role} />
      <Can
        resource={{
          type: 'workspaceMember',
          id: {
            workspaceId: workspaceId as WorkspaceId,
            memberUserId: (member.userId ?? member.id) as UserId,
          },
        }}
        action="remove"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive"
              disabled={removeMember.isPending}
              onSelect={handleRemove}
            >
              {m.member_remove_workspace()}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Can>
    </div>
  )
}
