import { Button } from '@/components/ui/button'
import { useApprovePageAccess } from '@/features/pages/hooks/use-approve-page-access'
import { useRejectPageAccess } from '@/features/pages/hooks/use-reject-page-access'
import { useMarkAsRead } from '../hooks/use-mark-as-read'
import type { PageAccessRequestNotification } from '../types'
import * as m from '@/paraglide/messages'

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

export function PageAccessRequestContent({
  notification,
}: {
  notification: PageAccessRequestNotification
}) {
  const approveAccess = useApprovePageAccess()
  const rejectAccess = useRejectPageAccess()
  const markAsRead = useMarkAsRead()

  const isPending = approveAccess.isPending || rejectAccess.isPending

  async function handleGrant() {
    if (!notification.metadata.requestId) return
    await approveAccess.mutateAsync({
      workspaceId: notification.metadata.workspaceId,
      pageId: notification.metadata.pageId,
      requestId: notification.metadata.requestId,
    })
    await markAsRead.mutateAsync(notification.id)
  }

  async function handleReject() {
    if (!notification.metadata.requestId) return
    await rejectAccess.mutateAsync({
      workspaceId: notification.metadata.workspaceId,
      pageId: notification.metadata.pageId,
      requestId: notification.metadata.requestId,
    })
    await markAsRead.mutateAsync(notification.id)
  }

  const requestedRole = (notification.metadata as any).requestedRole ?? 'editor'

  return (
    <div>
      <p className="text-sm">
        {m.notification_access_requested({
          name: notification.metadata.requestedByName,
          pageTitle: notification.metadata.pageTitle,
          role: getTranslatedRole(requestedRole),
        })}
      </p>
      {!notification.isRead && notification.metadata.requestId && (
        <div className="mt-2 flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleGrant()
            }}
          >
            {approveAccess.isPending
              ? m.notification_access_granting()
              : m.invitation_accept()}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleReject()
            }}
          >
            {m.invitation_decline()}
          </Button>
        </div>
      )}
    </div>
  )
}
