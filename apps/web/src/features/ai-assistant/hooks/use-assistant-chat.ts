import * as React from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type {
  AssistantThreadId,
  ChatMessage,
  ToolPart,
} from '../types'
import {
  getUIMessageText,
  optimisticallyUpdateThreadMessagesCache,
} from '../utils'

export interface UseAssistantChatOptions {
  workspaceId: WorkspaceId
  activeThreadId: AssistantThreadId | null
}

export function useAssistantChat({
  workspaceId,
  activeThreadId,
}: UseAssistantChatOptions) {
  const queryClient = useQueryClient()
  const activeThreadIdRef = React.useRef(activeThreadId)
  activeThreadIdRef.current = activeThreadId

  const transport = React.useMemo(() => {
    return new DefaultChatTransport({
      api: activeThreadId
        ? `/api/v1/workspaces/${workspaceId}/assistant/threads/${activeThreadId}/chat`
        : `/api/v1/workspaces/${workspaceId}/assistant/threads/temp/chat`,
      credentials: 'include',
    })
  }, [workspaceId, activeThreadId])

  const chat = useChat<ChatMessage>({
    transport,
    onFinish: async ({ message }) => {
      const threadId = activeThreadIdRef.current
      if (!threadId || !workspaceId) return

      const userMessage = [...chat.messages]
        .reverse()
        .find((m) => m.role === 'user')
      if (!userMessage) return

      optimisticallyUpdateThreadMessagesCache({
        queryClient,
        workspaceId,
        threadId,
        userMessage,
        assistantMessage: message,
      })

      chat.setMessages([])
    },
    onError: (error) => {
      console.error('useAssistantChat error:', error)
      toast.error(error.message || 'Failed to stream assistant response')
    },
  })

  const currentAssistantMessage = [...chat.messages]
    .reverse()
    .find((m) => m.role === 'assistant')

  const currentStreamingText = getUIMessageText(currentAssistantMessage)

  const activeToolParts: ToolPart[] = React.useMemo(() => {
    if (!currentAssistantMessage?.parts) return []
    return currentAssistantMessage.parts.filter(
      (part): part is ToolPart => part.type.startsWith('tool-'),
    )
  }, [currentAssistantMessage])

  const isStreaming = chat.status === 'streaming' || chat.status === 'submitted'

  const userMessage = [...chat.messages]
    .reverse()
    .find((m) => m.role === 'user')
  const optimisticUserText = isStreaming ? getUIMessageText(userMessage) : null

  return {
    ...chat,
    isStreaming,
    streamingText: currentStreamingText,
    toolParts: activeToolParts,
    optimisticUserMessage:
      typeof optimisticUserText === 'string' && optimisticUserText.length > 0
        ? optimisticUserText
        : null,
    sendMessage: async (content: string) => {
      await chat.sendMessage({
        text: content,
      })
    },
  }
}
