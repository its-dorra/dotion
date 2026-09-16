import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MemberAvatar } from '@/features/workspaces/components/member-avatar'
import { useUpdatePagePermission } from '../hooks/use-update-page-permission'
import type { PageMemberPermission, PagePermissionRole } from '../types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'
import { m } from '@/paraglide/messages'

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
  workspaceId: WorkspaceId
  pageId: PageId
  permission: PageMemberPermission
  canManage: boolean
}

export function PagePermissionRow({
  workspaceId,
  pageId,
  permission,
  canManage,
}: PagePermissionRowProps) {
  const updatePermission = useUpdatePagePermission()
  const isOwner = permission.workspaceRole === 'owner'

  async function handleChangeRole(role: PagePermissionRole) {
    if (isOwner) return

    await updatePermission.mutateAsync({
      workspaceId,
      pageId,
      userId: permission.userId,
      role,
    })
  }

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
      {canManage && !isOwner ? (
        <Select
          value={permission.role}
          disabled={updatePermission.isPending}
          onValueChange={(value) =>
            handleChangeRole(value as PagePermissionRole)
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
          {isOwner
            ? m.workspace_role_owner()
            : getTranslatedRole(permission.role)}
        </span>
      )}
    </div>
  )
}
