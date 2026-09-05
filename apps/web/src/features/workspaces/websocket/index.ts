import { WebSocketClient } from '@/lib/web-socket-client'
import { WorkspaceWsMessageSchema } from '@dotion/shared/workspaces/ws.schema'
import type { WorkspaceWsMessage } from '@dotion/shared/workspaces/types'

export function createWorkspaceWebSocket(workspaceId: string) {
  return new WebSocketClient<WorkspaceWsMessage>({
    url: getWorkspaceWebSocketUrl(workspaceId),

    channelName: `workspace:${workspaceId}`,

    decodeMessage(message: unknown) {
      if (typeof message !== 'string') {
        throw new Error('Invalid workspace WebSocket message: not a string')
      }

      try {
        return WorkspaceWsMessageSchema.parse(JSON.parse(message))
      } catch {
        console.error('Invalid workspace WebSocket message', message)

        throw new Error('Invalid workspace WebSocket message: not a string')
      }
    },

    encodeMessage(message: WorkspaceWsMessage) {
      return JSON.stringify(message)
    },

    reconnect: true,

    maxReconnectDelay: 30_000,
  })
}

function getWorkspaceWebSocketUrl(workspaceId: string) {
  return `/api/v1/workspaces/${workspaceId}/ws`
}
