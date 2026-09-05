import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { createWorkspaceWebSocket } from '../websocket'

export const useWorkspaceWs = (workspaceId: string) => {
  const client = useMemo(
    () => createWorkspaceWebSocket(workspaceId),
    [workspaceId],
  )

  const status = useSyncExternalStore(
    client.subscribeStatus.bind(client),
    client.getStatus.bind(client),
    client.getStatus.bind(client),
  )

  useEffect(() => {
    client.connect()

    return () => {
      client.disconnect()
    }
  }, [client])

  return {
    status,

    subscribe: client.subscribe.bind(client),

    send: client.send.bind(client),
  }
}
