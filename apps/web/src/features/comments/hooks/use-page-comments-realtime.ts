import { useEffect } from 'react'
import type { QueryClient } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import type { WebSocketClient } from '@/lib/web-socket-client'
import type { PageId, PageWsMessage } from '@/features/pages/types'
import type { CommentWsMessage } from '@dotion/shared/comments/types'
import {
  handleCommentCreatedWsMessage,
  handleCommentResolvedWsMessage,
  handleCommentDeletedWsMessage,
} from '../utils'
import type { WorkspaceId } from '@/features/workspaces/types'

interface CommentWsHandlerContext {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  pageId: PageId
}

type CommentWsStrategy<T extends CommentWsMessage['type']> = (
  payload: Extract<CommentWsMessage, { type: T }>['payload'],
  ctx: CommentWsHandlerContext,
) => void

const COMMENT_WS_STRATEGIES: {
  [K in CommentWsMessage['type']]: CommentWsStrategy<K>
} = {
  'comment.created': (payload, { queryClient, workspaceId, pageId }) => {
    handleCommentCreatedWsMessage({
      queryClient,
      workspaceId,
      pageId,
      payload,
    })
  },
  'comment.resolved': (payload, { queryClient, workspaceId, pageId }) => {
    handleCommentResolvedWsMessage({
      queryClient,
      workspaceId,
      pageId,
      payload,
    })
  },
  'comment.deleted': (payload, { queryClient, workspaceId, pageId }) => {
    handleCommentDeletedWsMessage({
      queryClient,
      workspaceId,
      pageId,
      payload,
    })
  },
}

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
      const strategy = COMMENT_WS_STRATEGIES[message.type] as
        | CommentWsStrategy<typeof message.type>
        | undefined
      if (strategy) {
        strategy(message.payload as never, { queryClient, workspaceId, pageId })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [pageId, workspaceId, wsClient, queryClient])
}
