import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MemberAvatar } from '@/features/workspaces/components/member-avatar'
import type { PageMemberPermission, PagePermissionRole } from '../types'
import * as m from '@/paraglide/messages'

function getTranslatedRole(role: string) {
  switch (role) {
    case 'owner':
      return m.workspace_role_owner()
    case 'editor':
      return m.page_role_editor()
    case 'commenter':
      return m.page_role_commenter()
    case 'viewer':
      return m.workspace_role_viewer()
    default:
      return role
  }
}

interface PagePermissionRowProps {
  permission: PageMemberPermission
  canManage: boolean
  onChangeRole: (userId: string, role: PagePermissionRole) => void
}

export function PagePermissionRow({
  permission,
  canManage,
  onChangeRole,
}: PagePermissionRowProps) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <MemberAvatar
        name={permission.name}
        avatarUrl={permission.avatarUrl}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{permission.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {permission.email}
        </p>
      </div>
      {canManage ? (
        <Select
          value={permission.role}
          onValueChange={(value) =>
            onChangeRole(permission.userId, value as PagePermissionRole)
          }
        >
          <SelectTrigger className="h-7 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">{m.workspace_role_viewer()}</SelectItem>
            <SelectItem value="commenter">{m.page_role_commenter()}</SelectItem>
            <SelectItem value="editor">{m.page_role_editor()}</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <span className="text-xs capitalize text-muted-foreground">
          {getTranslatedRole(permission.role)}
        </span>
      )}
    </div>
  )
}
