import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { WebSocketClient } from '@/lib/web-socket-client'
import type { PageId, PageWsMessage } from '@/features/pages/types'
import {
  handleCommentCreatedWsMessage,
  handleCommentResolvedWsMessage,
  handleCommentDeletedWsMessage,
} from '../utils'
import type { WorkspaceId } from '@/features/workspaces/types'

export function usePageCommentsRealtime({
  pageId,
  workspaceId,
  wsClient,
}: {
  workspaceId: WorkspaceId
  pageId: PageId
  wsClient: WebSocketClient<PageWsMessage> | null | undefined
}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!wsClient) return

    const unsubscribe = wsClient.subscribe(({ payload, source }) => {
      if (source !== 'websocket' || payload.type !== 'comment') return

      const message = payload.data
      switch (message.type) {
        case 'comment.created': {
          handleCommentCreatedWsMessage({
            queryClient,
            workspaceId,
            pageId,
            payload: message.payload,
          })
          break
        }
        case 'comment.resolved': {
          handleCommentResolvedWsMessage({
            queryClient,
            workspaceId,
            pageId,
            payload: message.payload,
          })
          break
        }
        case 'comment.deleted': {
          handleCommentDeletedWsMessage({
            queryClient,
            workspaceId,
            pageId,
            payload: message.payload,
          })
          break
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [pageId, workspaceId, wsClient, queryClient])
}
