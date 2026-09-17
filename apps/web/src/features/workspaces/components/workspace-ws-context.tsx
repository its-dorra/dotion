import type { MessageSource, WebSocketStatus } from '@/lib/web-socket-client'
import type {
  WorkspaceWsMessage,
  WorkspaceId,
} from '@dotion/shared/workspaces/types'
import { createContext, useContext, useMemo } from 'react'
import { useWorkspaceWs } from '../hooks/use-workspace-ws'

type WorkspaceWebSocketContextValue = {
  workspaceId: WorkspaceId
  status: WebSocketStatus

  subscribe: (
    listener: (data: {
      source: MessageSource
      payload: WorkspaceWsMessage
    }) => void,
  ) => () => void

  send: (message: WorkspaceWsMessage) => void
}

const WorkspaceWebSocketContext = createContext<
  WorkspaceWebSocketContextValue | undefined
>(undefined)

export default function WorkspaceWsProvider({
  workspaceId,
  children,
}: {
  workspaceId: WorkspaceId
  children: React.ReactNode
}) {
  const { status, subscribe, send } = useWorkspaceWs(workspaceId)

  const value = useMemo(
    () => ({
      workspaceId,
      status,
      subscribe,
      send,
    }),
    [workspaceId, status, subscribe, send],
  )

  return (
    <WorkspaceWebSocketContext.Provider value={value}>
      {children}
    </WorkspaceWebSocketContext.Provider>
  )
}

export const useWorkspaceWsContext = () => {
  const context = useContext(WorkspaceWebSocketContext)

  if (!context) {
    throw new Error(
      'useWorkspaceWebSocketContext must be used within a WorkspaceWebSocketProvider',
    )
  }

  return context
}
