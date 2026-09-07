import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { aiAssistantApi } from '../api'
import { assistantKeys } from '../query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId } from '../types'

export interface StreamAssistantChatInput {
  threadId: AssistantThreadId
  content: string
  isFirstTurn?: boolean
}

export function useStreamAssistantChat(workspaceId: WorkspaceId) {
  const queryClient = useQueryClient()
  const [streamingText, setStreamingText] = React.useState('')
  const abortControllerRef = React.useRef<AbortController | null>(null)

  const mutation = useMutation(
    resultMutationOptions({
      mutationFn: async ({ threadId, content }: StreamAssistantChatInput) => {
        const abortController = new AbortController()
        abortControllerRef.current = abortController
        setStreamingText('')

        return aiAssistantApi.streamChat(workspaceId, threadId, content, {
          signal: abortController.signal,
          onChunk: (chunk) => {
            setStreamingText((prev) => prev + chunk)
          },
        })
      },
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({
          queryKey: assistantKeys.messages(workspaceId, variables.threadId),
        })

        if (variables.isFirstTurn) {
          queryClient.invalidateQueries({
            queryKey: assistantKeys.threads(workspaceId),
          })
        }
      },
      onError: (error: any) => {
        console.error('useStreamAssistantChat error:', error)
        if (error?.isTagged && error.name === 'QuotaExceededError') {
          toast.error(error.message || m.toast_assistant_quota_exceeded())
        } else if (error?.isTagged && error.name === 'ThreadNotFoundError') {
          toast.error(m.toast_assistant_thread_deleted())
        } else if (error?.isTagged && error.name === 'AuthenticationError') {
          toast.error(m.toast_assistant_auth_required())
        } else if (error?.isTagged && error.name === 'AuthorizationError') {
          toast.error(m.toast_assistant_access_denied())
        } else {
          toast.error(error?.message || m.toast_assistant_stream_failed())
        }
      },
      onSettled: () => {
        setStreamingText('')
        abortControllerRef.current = null
      },
    }),
  )

  const stopStreaming = React.useCallback(() => {
    abortControllerRef.current?.abort()
    setStreamingText('')
    mutation.reset()
  }, [mutation])

  return {
    ...mutation,
    streamingText,
    optimisticUserMessage: mutation.isPending
      ? (mutation.variables?.content ?? null)
      : null,
    isStreaming: mutation.isPending,
    stopStreaming,
  }
}
