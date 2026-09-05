import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { NotificationRow } from './notification-row'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import { useMarkAllAsRead } from '../hooks/use-mark-all-as-read'
import { InvitationResponseModal } from '@/features/workspaces/components/invitation-response-modal'
import { useAcceptInvitation } from '@/features/workspaces/hooks/use-accept-invitation'
import { useDeclineInvitation } from '@/features/workspaces/hooks/use-decline-invitation'
import type { WorkspaceInvitation } from '@/features/workspaces/types'
import type { Notification, WorkspaceInvitationNotification } from '../types'
import * as m from '@/paraglide/messages'

interface NotificationsListPresenterProps {
  notifications: Notification[]
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
}

export function NotificationsListPresenter({
  notifications,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: NotificationsListPresenterProps) {
  const [activeNotification, setActiveNotification] =
    useState<WorkspaceInvitationNotification | null>(null)

  const markAllAsRead = useMarkAllAsRead()
  const acceptInvitation = useAcceptInvitation()
  const declineInvitation = useDeclineInvitation()

  const hasUnread = notifications.some((n) => !n.isRead)

  async function handleAccept(invitationId: string) {
    try {
      await acceptInvitation.mutateAsync({ invitationId })
      setActiveNotification(null)
    } catch {
      // handled by mutation hook
    }
  }

  async function handleDecline(invitationId: string) {
    try {
      await declineInvitation.mutateAsync({ invitationId })
      setActiveNotification(null)
    } catch {
      // handled by mutation hook
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAsRead.mutateAsync(undefined)
    } catch {
      // handled by mutation hook
    }
  }

  const activeInvitation: WorkspaceInvitation | null = activeNotification
    ? {
        id: activeNotification.metadata.workspaceInvitationId as any,
        workspaceId: activeNotification.metadata.workspaceId,
        workspaceName: activeNotification.metadata.workspaceName,
        workspaceIcon: activeNotification.metadata.workspaceIcon ?? null,
        invitedByUserId: activeNotification.metadata.invitedByUserId,
        invitedByName: activeNotification.metadata.invitedByName,
        invitedUserId: '' as any,
        invitedUserEmail: '',
        invitedUserName: '',
        status: 'pending',
        createdAt: activeNotification.createdAt,
        updatedAt: activeNotification.updatedAt,
      }
    : null

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-xs font-medium text-muted-foreground">
          {m.notifications_title()}
        </span>
        {hasUnread ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            disabled={markAllAsRead.isPending}
            onClick={handleMarkAllAsRead}
          >
            {markAllAsRead.isPending
              ? m.common_loading()
              : m.notifications_mark_all_read()}
          </Button>
        ) : null}
      </div>

      <div className="space-y-0.5">
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onWorkspaceInvitationClick={(n) => setActiveNotification(n)}
          />
        ))}
      </div>

      <InfiniteScroll
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        loadingText="Loading more notifications…"
        loadMoreText="Load more notifications"
      />

      {activeInvitation ? (
        <InvitationResponseModal
          invitation={activeInvitation}
          open={Boolean(activeNotification)}
          onOpenChange={(open) => {
            if (!open) setActiveNotification(null)
          }}
          onAccept={handleAccept}
          onDecline={handleDecline}
          isResponding={
            acceptInvitation.isPending || declineInvitation.isPending
          }
        />
      ) : null}
    </div>
  )
}
