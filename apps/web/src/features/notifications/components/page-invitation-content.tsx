import type { PageInvitationNotification } from '../types'
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

export function PageInvitationContent({
  notification,
}: {
  notification: PageInvitationNotification
}) {
  return (
    <p className="text-sm">
      {m.notification_page_invited({
        name: notification.metadata.invitedByName,
        pageTitle: notification.metadata.pageTitle,
        role: getTranslatedRole(notification.metadata.role),
      })}
    </p>
  )
}
