import { useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { createUserWebSocket } from '../websocket'
import {
  addNotificationToCache,
  markNotificationAsReadInCache,
  markAllNotificationsAsReadInCache,
} from '../utils'
import {
  updatePageAccessRequestStatusInCache,
  updatePagePermissionInCache,
} from '@/features/pages/utils'
import type { PagePermissionRole } from '@dotion/shared/pages/types'
import { m } from '@/paraglide/messages'

import type {
  UserWsMessage,
  Notification,
  NotificationMetadata,
} from '@dotion/shared/notifications/types'
import type { MessageSource } from '@/lib/web-socket-client'

interface UserWsContext {
  queryClient: QueryClient
}

type NotificationMetaType = NotificationMetadata['type']

type NotificationStrategy<T extends NotificationMetaType> = (
  notif: Notification,
  meta: Extract<NotificationMetadata, { type: T }>,
  ctx: UserWsContext,
) => void

const NOTIFICATION_METADATA_STRATEGIES: {
  [K in NotificationMetaType]: NotificationStrategy<K>
} = {
  'workspace.invitation_created': (_notif, meta) => {
    toast.info(
      m.notification_workspace_invited({
        name: meta.invitedByName,
        workspace: meta.workspaceName,
      }),
    )
  },
  'page.access_requested': (_notif, meta) => {
    const roleName =
      meta.requestedRole === 'commenter'
        ? m.page_role_commenter()
        : m.page_role_editor()
    toast.info(
      m.notification_access_requested({
        name: meta.requestedByName,
        pageTitle: meta.pageTitle,
        role: roleName,
      }),
    )
  },
  'page.permission_updated': (notif, meta, { queryClient }) => {
    const roleName =
      meta.newRole === 'editor'
        ? m.page_role_editor()
        : meta.newRole === 'commenter'
          ? m.page_role_commenter()
          : m.workspace_role_viewer()
    toast.info(
      m.notification_permission_changed({
        name: meta.changedByName,
        pageTitle: meta.pageTitle,
        role: roleName,
      }),
    )
    updatePageAccessRequestStatusInCache({
      queryClient,
      workspaceId: meta.workspaceId,
      pageId: meta.pageId,
      status: { hasPendingRequest: false, request: null },
    })
    updatePagePermissionInCache({
      queryClient,
      workspaceId: meta.workspaceId,
      pageId: meta.pageId,
      userId: notif.userId,
      role: meta.newRole as PagePermissionRole,
    })
  },
  'page.access_request_resolved': (notif, meta, { queryClient }) => {
    if (meta.status === 'approved') {
      toast.success(
        m.notification_access_granted({
          name: meta.resolvedByName,
          pageTitle: meta.pageTitle,
          role:
            meta.role === 'commenter'
              ? m.page_role_commenter()
              : m.page_role_editor(),
        }),
      )
      updatePagePermissionInCache({
        queryClient,
        workspaceId: meta.workspaceId,
        pageId: meta.pageId,
        userId: notif.userId,
        role: meta.role as PagePermissionRole,
      })
    } else {
      toast.info(
        m.notification_access_rejected({
          name: meta.resolvedByName,
          pageTitle: meta.pageTitle,
        }),
      )
    }
    updatePageAccessRequestStatusInCache({
      queryClient,
      workspaceId: meta.workspaceId,
      pageId: meta.pageId,
      status: { hasPendingRequest: false, request: null },
    })
  },
  'page.invitation_created': (_notif, meta) => {
    toast.info(
      m.notification_page_invited({
        name: meta.invitedByName,
        pageTitle: meta.pageTitle,
        role:
          meta.role === 'editor'
            ? m.page_role_editor()
            : meta.role === 'commenter'
              ? m.page_role_commenter()
              : m.workspace_role_viewer(),
      }),
    )
  },
}

type UserWsStrategy<T extends UserWsMessage['type']> = (
  payload: Extract<UserWsMessage, { type: T }>['payload'],
  ctx: UserWsContext,
) => void

const USER_WS_STRATEGIES: {
  [K in UserWsMessage['type']]: UserWsStrategy<K>
} = {
  'notification.created': (notif, ctx) => {
    addNotificationToCache({
      queryClient: ctx.queryClient,
      notification: notif,
    })
    const strategy = NOTIFICATION_METADATA_STRATEGIES[
      notif.metadata.type as NotificationMetaType
    ] as NotificationStrategy<NotificationMetaType> | undefined

    if (strategy) {
      strategy(notif, notif.metadata as never, ctx)
    } else {
      toast.info(m.toast_notification_new())
    }
  },
  'notification.read': (payload, { queryClient }) => {
    markNotificationAsReadInCache({
      queryClient,
      notificationId: payload.notificationId,
    })
  },
  'notification.all_read': (payload, { queryClient }) => {
    markAllNotificationsAsReadInCache({
      queryClient,
      workspaceId: payload.workspaceId,
    })
  },
}

export function useUserRealtime() {
  const queryClient = useQueryClient()
  const client = useMemo(() => createUserWebSocket(), [])

  useEffect(() => {
    client.connect()

    const unsubscribe = client.subscribe(
      ({
        payload: data,
        source,
      }: {
        payload: UserWsMessage
        source: MessageSource
      }) => {
        if (source !== 'websocket') return

        const strategy = USER_WS_STRATEGIES[data.type] as
          | UserWsStrategy<typeof data.type>
          | undefined
        if (strategy) {
          strategy(data.payload as never, { queryClient })
        }
      },
    )

    return () => {
      unsubscribe()
      client.disconnect()
    }
  }, [client, queryClient])
}
