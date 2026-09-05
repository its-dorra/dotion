import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import * as Y from 'yjs'
import { WebSocketClient } from '@/lib/web-socket-client'
import { PageYjsProvider } from '../lib/page-yjs-provider'
import { CommentWsMessageSchema } from '@dotion/shared/comments/ws.schema'
import type { PageWsMessage } from '../types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'

function getPageWsUrl(workspaceId: WorkspaceId, pageId: PageId) {
  return `/api/v1/workspaces/${workspaceId}/pages/${pageId}/ws`
}

export function usePageYjs(workspaceId: WorkspaceId, pageId: PageId) {
  const wsClient = useMemo(
    () =>
      new WebSocketClient<PageWsMessage>({
        url: getPageWsUrl(workspaceId, pageId),
        channelName: `page:${pageId}`,

        decodeMessage(data) {
          if (typeof data === 'string') {
            try {
              const parsed = CommentWsMessageSchema.parse(JSON.parse(data))
              return { type: 'comment', data: parsed }
            } catch {
              throw new Error('Failed to parse comment JSON from WebSocket')
            }
          }

          if (data instanceof ArrayBuffer) {
            return { type: 'yjs', data }
          }

          throw new Error('Unknown page WebSocket message format')
        },

        encodeMessage(message) {
          if (message.type === 'yjs') {
            return message.data
          }
          return JSON.stringify(message.data)
        },

        reconnect: true,
        maxReconnectDelay: 30_000,
      }),
    [workspaceId, pageId],
  )

  const doc = useMemo(() => new Y.Doc(), [pageId])

  const provider = useMemo(
    () => new PageYjsProvider(doc, wsClient),
    [doc, wsClient],
  )

  const status = useSyncExternalStore(
    wsClient.subscribeStatus.bind(wsClient),
    wsClient.getStatus.bind(wsClient),
    wsClient.getStatus.bind(wsClient),
  )

  const [synced, setSynced] = useState(() => provider.synced)

  useEffect(() => {
    if (provider.synced) {
      setSynced(true)
      return
    }

    setSynced(false)

    const onSynced = () => setSynced(true)
    provider.on('synced', onSynced)

    return () => {
      provider.off('synced', onSynced)
    }
  }, [provider])

  useEffect(() => {
    wsClient.connect()

    return () => {
      wsClient.disconnect()
    }
  }, [wsClient])

  return { provider, doc, status, wsClient, synced }
}
