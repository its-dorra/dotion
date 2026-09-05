import type { WorkspaceInvitationNotification } from '../types'
import * as m from '@/paraglide/messages'

export function WorkspaceInvitationContent({
  notification,
}: {
  notification: WorkspaceInvitationNotification
}) {
  return (
    <p className="text-sm">
      {m.notification_workspace_invited({
        name: notification.metadata.invitedByName,
        workspace: notification.metadata.workspaceName,
      })}
    </p>
  )
}
