import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { createWorkspaceWebSocket } from '../websocket'
import type { WorkspaceId } from '../types'

export const useWorkspaceWs = (workspaceId: WorkspaceId) => {
  const client = useMemo(
    () => createWorkspaceWebSocket(workspaceId),
    [workspaceId],
  )

  const subscribeStatus = useCallback(
    (onStoreChange: () => void) => client.subscribeStatus(onStoreChange),
    [client],
  )

  const getStatus = useCallback(() => client.getStatus(), [client])

  const status = useSyncExternalStore(subscribeStatus, getStatus, getStatus)

  useEffect(() => {
    client.connect()

    return () => {
      client.disconnect()
    }
  }, [client])

  const subscribe = useCallback(
    (listener: Parameters<typeof client.subscribe>[0]) =>
      client.subscribe(listener),
    [client],
  )

  const send = useCallback(
    (message: Parameters<typeof client.send>[0]) => client.send(message),
    [client],
  )

  return {
    status,
    subscribe,
    send,
  }
}
