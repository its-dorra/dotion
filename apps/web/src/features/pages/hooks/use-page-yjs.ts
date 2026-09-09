import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
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

function createWsClient(workspaceId: WorkspaceId, pageId: PageId) {
  return new WebSocketClient<PageWsMessage>({
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
  })
}

export function usePageYjs(workspaceId: WorkspaceId, pageId: PageId) {
  const [instances, setInstances] = useState<{
    wsClient: WebSocketClient<PageWsMessage>
    doc: Y.Doc
    provider: PageYjsProvider
  } | null>(null)

  const [synced, setSynced] = useState(false)

  useEffect(() => {
    const wsClient = createWsClient(workspaceId, pageId)
    const doc = new Y.Doc()
    const provider = new PageYjsProvider(doc, wsClient)

    setInstances({ wsClient, doc, provider })
    setSynced(false)

    const onSynced = () => setSynced(true)
    provider.on('synced', onSynced)

    wsClient.connect()

    return () => {
      provider.off('synced', onSynced)
      provider.destroy()
      doc.destroy()
      wsClient.destroy()
      setInstances(null)
      setSynced(false)
    }
  }, [workspaceId, pageId])

  const wsClient = instances?.wsClient ?? null
  const subscribeStatus = useRef((_cb: () => void) => {
    return () => {}
  })
  const getStatus = useRef(
    (): 'disconnected' | 'connecting' | 'connected' | 'reconnecting' =>
      'disconnected',
  )

  if (wsClient) {
    subscribeStatus.current = wsClient.subscribeStatus.bind(wsClient)
    getStatus.current = wsClient.getStatus.bind(wsClient)
  } else {
    subscribeStatus.current = () => () => {}
    getStatus.current = () => 'disconnected'
  }

  const status = useSyncExternalStore(
    (cb) => subscribeStatus.current(cb),
    () => getStatus.current(),
    () => getStatus.current(),
  )

  return {
    provider: instances?.provider ?? null,
    doc: instances?.doc ?? null,
    status,
    wsClient,
    synced,
  }
}
