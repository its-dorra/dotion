import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { pageDetailQueryOptions, pageTreeQueryOptions } from '../query-options'
import type { WebSocketClient } from '@/lib/web-socket-client'
import type {
  PageId,
  PageTreeNode,
  PageWsMessage,
  UpdatePageMetadataInput,
} from '../types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

interface UseUpdatePageMetadataOptions {
  workspaceId: WorkspaceId
  pageId: PageId
  wsClient: WebSocketClient<PageWsMessage> | null
}

export function useUpdatePageMetadata({
  workspaceId,
  pageId,
  wsClient,
}: UseUpdatePageMetadataOptions) {
  const queryClient = useQueryClient()

  const sendMetadataUpdate = useCallback(
    (metadata: UpdatePageMetadataInput) => {
      queryClient.setQueryData(
        pageDetailQueryOptions(workspaceId, pageId).queryKey,
        (old) => {
          if (!old) return old
          return {
            ...old,
            ...(metadata.title !== undefined ? { title: metadata.title } : {}),
            ...(metadata.icon !== undefined ? { icon: metadata.icon } : {}),
            ...(metadata.cover !== undefined ? { cover: metadata.cover } : {}),
          }
        },
      )

      if (metadata.title !== undefined || metadata.icon !== undefined) {
        queryClient.setQueryData(
          pageTreeQueryOptions(workspaceId).queryKey,
          (old: PageTreeNode[] | undefined) => {
            if (!old) return old
            return old.map((node) => {
              if (node.id === pageId) {
                return {
                  ...node,
                  ...(metadata.title !== undefined
                    ? { title: metadata.title }
                    : {}),
                  ...(metadata.icon !== undefined
                    ? { icon: metadata.icon }
                    : {}),
                }
              }
              return node
            })
          },
        )
      }

      wsClient
        ?.send({
          type: 'metadata',
          data: {
            type: 'page.update_metadata',
            payload: metadata,
          },
        })
        .catch((error) => {
          console.error('Failed to send page metadata update:', error)
        })
    },
    [queryClient, pageId, workspaceId, wsClient],
  )

  const updateTitle = useCallback(
    (title: string) => {
      sendMetadataUpdate({ title })
    },
    [sendMetadataUpdate],
  )

  const updateIcon = useCallback(
    (icon: string | null) => {
      sendMetadataUpdate({ icon })
    },
    [sendMetadataUpdate],
  )

  const updateCover = useCallback(
    (cover: string | null) => {
      sendMetadataUpdate({ cover })
    },
    [sendMetadataUpdate],
  )

  return {
    updateTitle,
    updateIcon,
    updateCover,
    sendMetadataUpdate,
  }
}
