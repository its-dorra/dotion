import type { PageAccessRequestResolvedNotification } from '../types'
import { m } from '@/paraglide/messages'

function getTranslatedRole(role: string) {
  switch (role) {
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

export function PageAccessRequestResolvedContent({
  notification,
}: {
  notification: PageAccessRequestResolvedNotification
}) {
  const meta = notification.metadata

  if (meta.status === 'approved') {
    return (
      <p className="text-sm">
        {m.notification_access_granted({
          name: meta.resolvedByName,
          pageTitle: meta.pageTitle,
          role: getTranslatedRole(meta.role),
        })}
      </p>
    )
  }

  return (
    <p className="text-sm">
      {m.notification_access_rejected({
        name: meta.resolvedByName,
        pageTitle: meta.pageTitle,
      })}
    </p>
  )
}
