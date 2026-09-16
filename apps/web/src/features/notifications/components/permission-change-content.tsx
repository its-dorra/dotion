import type { PermissionChangeNotification } from '../types'
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

export function PermissionChangeContent({
  notification,
}: {
  notification: PermissionChangeNotification
}) {
  return (
    <p className="text-sm">
      {m.notification_permission_changed({
        name: notification.metadata.changedByName,
        pageTitle: notification.metadata.pageTitle,
        role: getTranslatedRole(notification.metadata.newRole),
      })}
    </p>
  )
}
