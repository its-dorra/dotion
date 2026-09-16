import * as React from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId, ChatMessage, ToolPart } from '../types'
import {
  getUIMessageText,
  optimisticallyUpdateThreadMessagesCache,
  touchThreadInCache,
} from '../utils'
import { useCreateAssistantThread } from './use-create-assistant-thread'

export interface UseAssistantChatOptions {
  workspaceId: WorkspaceId
  activeThreadId: AssistantThreadId | null
  onThreadCreated?: (threadId: AssistantThreadId) => void
}

export function useAssistantChat({
  workspaceId,
  activeThreadId,
  onThreadCreated,
}: UseAssistantChatOptions) {
  const queryClient = useQueryClient()
  const createThreadMutation = useCreateAssistantThread(workspaceId)

  const activeThreadIdRef = React.useRef<AssistantThreadId | null>(
    activeThreadId,
  )
  activeThreadIdRef.current = activeThreadId

  const onThreadCreatedRef = React.useRef(onThreadCreated)
  onThreadCreatedRef.current = onThreadCreated

  const transport = React.useMemo(() => {
    return new DefaultChatTransport({
      api: `/api/v1/workspaces/${workspaceId}/assistant/threads/placeholder/chat`,
      credentials: 'include',
      prepareSendMessagesRequest: ({
        messages,
        body,
        headers,
        credentials,
        id,
        trigger,
        messageId,
      }) => {
        const currentThreadId = activeThreadIdRef.current
        if (!currentThreadId) {
          throw new Error('Cannot send message without an active thread')
        }
        return {
          api: `/api/v1/workspaces/${workspaceId}/assistant/threads/${currentThreadId}/chat`,
          body: {
            ...body,
            id,
            messages,
            trigger,
            messageId,
          },
          headers,
          credentials,
        }
      },
    })
  }, [workspaceId])

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

      touchThreadInCache({
        queryClient,
        workspaceId,
        threadId,
      })
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
    return currentAssistantMessage.parts.filter((part): part is ToolPart =>
      part.type.startsWith('tool-'),
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
      let currentThreadId = activeThreadIdRef.current
      if (!currentThreadId) {
        const newThread = await createThreadMutation.mutateAsync({})
        currentThreadId = newThread.id
        activeThreadIdRef.current = currentThreadId
        onThreadCreatedRef.current?.(currentThreadId)
      }

      await chat.sendMessage({
        text: content,
      })
    },
  }
}
