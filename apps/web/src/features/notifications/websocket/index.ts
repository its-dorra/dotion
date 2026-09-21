import { WebSocketClient } from '@/lib/web-socket-client'
import { UserWsMessageSchema } from '@dotion/shared/notifications/ws.schema'
import type { UserWsMessage } from '@dotion/shared/notifications/ws.schema'

export function createUserWebSocket() {
  return new WebSocketClient<UserWsMessage>({
    url: '/api/v1/users/ws',
    channelName: 'user:notifications',
    decodeMessage(message: unknown) {
      if (typeof message !== 'string') {
        throw new Error('Invalid user WebSocket message: not a string')
      }
      try {
        const result = UserWsMessageSchema.safeParse(JSON.parse(message))
        if (!result.success) {
          throw new Error(
            `Invalid user WebSocket message , ${result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')}`,
          )
        }
        return result.data
      } catch {
        throw new Error('Invalid user WebSocket message')
      }
    },
    encodeMessage(message: UserWsMessage) {
      return JSON.stringify(message)
    },
    reconnect: true,
    maxReconnectDelay: 30_000,
  })
}
