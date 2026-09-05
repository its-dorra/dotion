import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { createUserWebSocket } from '../websocket'
import {
  addNotificationToCache,
  markNotificationAsReadInCache,
  markAllNotificationsAsReadInCache,
} from '../utils'
import { updatePageAccessRequestStatusInCache } from '@/features/pages/utils'
import { pagesKeys } from '@/features/pages/query-options'
import { authorizationKeys } from '@/features/authorization/query-options'
import { m } from '@/paraglide/messages'

import type { UserWsMessage } from '@dotion/shared/notifications/ws.schema'
import type { MessageSource } from '@/lib/web-socket-client'

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

        switch (data.type) {
          case 'notification.created': {
            const notif = data.payload
            addNotificationToCache(queryClient, notif)

            if (notif.metadata.type === 'workspace_invitation') {
              const meta = notif.metadata
              toast.info(
                m.notification_workspace_invited({
                  name: meta.invitedByName,
                  workspace: meta.workspaceName,
                }),
              )
            } else if (notif.metadata.type === 'page_access_request') {
              const meta = notif.metadata
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
            } else if (notif.metadata.type === 'permission_change') {
              const meta = notif.metadata
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
              updatePageAccessRequestStatusInCache(
                queryClient,
                meta.workspaceId,
                meta.pageId,
                { hasPendingRequest: false, request: null },
              )
              queryClient.invalidateQueries({
                queryKey: pagesKeys.permissions(meta.workspaceId, meta.pageId),
              })
              queryClient.invalidateQueries({
                queryKey: pagesKeys.detail(meta.pageId),
              })
              queryClient.invalidateQueries({
                queryKey: authorizationKeys.all,
              })
            } else if (notif.metadata.type === 'page_access_request_resolved') {
              const meta = notif.metadata
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
              } else {
                toast.info(
                  m.notification_access_rejected({
                    name: meta.resolvedByName,
                    pageTitle: meta.pageTitle,
                  }),
                )
              }
              updatePageAccessRequestStatusInCache(
                queryClient,
                meta.workspaceId,
                meta.pageId,
                { hasPendingRequest: false, request: null },
              )
              queryClient.invalidateQueries({
                queryKey: pagesKeys.permissions(meta.workspaceId, meta.pageId),
              })
              queryClient.invalidateQueries({
                queryKey: pagesKeys.detail(meta.pageId),
              })
              queryClient.invalidateQueries({
                queryKey: authorizationKeys.all,
              })
            } else if (notif.metadata.type === 'page_invitation') {
              const meta = notif.metadata
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
            } else {
              toast.info(m.toast_notification_new())
            }
            break
          }
          case 'notification.read': {
            markNotificationAsReadInCache(
              queryClient,
              data.payload.notificationId,
            )
            break
          }
          case 'notification.all_read': {
            markAllNotificationsAsReadInCache(
              queryClient,
              data.payload.workspaceId,
            )
            break
          }
        }
      },
    )

    return () => {
      unsubscribe()
      client.disconnect()
    }
  }, [client, queryClient])
}
