import { memo } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { NotificationIcon } from './notification-icon'
import { WorkspaceInvitationContent } from './workspace-invitation-content'
import { PageInvitationContent } from './page-invitation-content'
import { PermissionChangeContent } from './permission-change-content'
import { PageAccessRequestContent } from './page-access-request-content'
import { useMarkAsRead } from '../hooks/use-mark-as-read'
import * as m from '@/paraglide/messages'
import type {
  Notification,
  WorkspaceInvitationNotification,
  PageInvitationNotification,
  PermissionChangeNotification,
  PageAccessRequestNotification,
} from '../types'

function formatRelativeTime(isoDate: string | Date) {
  const dateMs =
    typeof isoDate === 'string'
      ? new Date(isoDate).getTime()
      : isoDate.getTime()
  const diffMinutes = Math.round((Date.now() - dateMs) / 60_000)
  if (diffMinutes < 1) return m.notification_time_now()
  let timeStr = ''
  if (diffMinutes < 60) {
    timeStr = `${diffMinutes}${m.time_unit_minute()}`
  } else {
    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) {
      timeStr = `${diffHours}${m.time_unit_hour()}`
    } else {
      timeStr = `${Math.round(diffHours / 24)}${m.time_unit_day()}`
    }
  }
  return m.notification_time_ago({ time: timeStr })
}

interface NotificationRowProps {
  notification: Notification
  onWorkspaceInvitationClick: (
    notification: WorkspaceInvitationNotification,
  ) => void
}

export const NotificationRow = memo(function NotificationRow({
  notification,
  onWorkspaceInvitationClick,
}: NotificationRowProps) {
  const markAsRead = useMarkAsRead()

  async function handleMarkRead() {
    if (!notification.isRead) {
      await markAsRead.mutateAsync(notification.id)
    }
  }

  const content = (() => {
    switch (notification.metadata.type) {
      case 'workspace_invitation':
        return (
          <WorkspaceInvitationContent
            notification={notification as WorkspaceInvitationNotification}
          />
        )
      case 'page_invitation':
        return (
          <PageInvitationContent
            notification={notification as PageInvitationNotification}
          />
        )
      case 'permission_change':
        return (
          <PermissionChangeContent
            notification={notification as PermissionChangeNotification}
          />
        )
      case 'page_access_request':
        return (
          <PageAccessRequestContent
            notification={notification as PageAccessRequestNotification}
          />
        )
    }
  })()

  const rowClasses = cn(
    'flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-accent cursor-pointer',
    !notification.isRead && 'bg-accent/40',
  )

  const inner = (
    <>
      <NotificationIcon type={notification.metadata.type} />
      <div className="min-w-0 flex-1">
        {content}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead ? (
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500"
          aria-label="Unread"
        />
      ) : null}
    </>
  )

  if (notification.metadata.type === 'workspace_invitation') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          handleMarkRead()
          onWorkspaceInvitationClick(
            notification as WorkspaceInvitationNotification,
          )
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleMarkRead()
            onWorkspaceInvitationClick(
              notification as WorkspaceInvitationNotification,
            )
          }
        }}
        className={cn(rowClasses, 'w-full text-left')}
      >
        {inner}
      </div>
    )
  }

  const meta = notification.metadata as any
  if (meta?.pageId && meta?.workspaceId) {
    return (
      <Link
        to="/app/workspaces/$workspaceId/pages/$pageId"
        params={{ workspaceId: meta.workspaceId, pageId: meta.pageId }}
        onClick={handleMarkRead}
        className={rowClasses}
      >
        {inner}
      </Link>
    )
  }

  return (
    <div onClick={handleMarkRead} className={rowClasses}>
      {inner}
    </div>
  )
})
