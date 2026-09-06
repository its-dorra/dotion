import { Badge } from '@/components/ui/badge'
import * as m from '@/paraglide/messages'
import type { WorkspaceRole } from '../types'

function getRoleLabel(role: WorkspaceRole): string {
  switch (role) {
    case 'owner':
      return m.workspace_role_owner()
    case 'member':
      return m.workspace_role_member()
    default:
      return role
  }
}

interface RoleBadgeProps {
  role: WorkspaceRole
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <Badge variant={role === 'owner' ? 'default' : 'secondary'}>
      {getRoleLabel(role)}
    </Badge>
  )
}
