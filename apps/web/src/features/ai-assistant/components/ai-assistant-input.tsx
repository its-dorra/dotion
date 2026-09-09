import * as React from 'react'
import { PromptInput } from '@/components/ai-elements'
import { useCreateAssistantThread } from '../hooks/use-create-assistant-thread'
import * as m from '@/paraglide/messages'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId } from '../types'

interface AiAssistantInputProps {
  workspaceId: WorkspaceId
  activeThreadId: AssistantThreadId | null
  onThreadCreated: (threadId: AssistantThreadId) => void
  onSendMessage: (content: string) => Promise<void>
  onStop: () => void
  isStreaming: boolean
}

export const AiAssistantInput = React.memo(
  function AiAssistantInput({
    workspaceId,
    activeThreadId,
    onThreadCreated,
    onSendMessage,
    onStop,
    isStreaming,
  }: AiAssistantInputProps) {
    const [promptText, setPromptText] = React.useState('')
    const createThreadMutation = useCreateAssistantThread(workspaceId)

    const handleSendPrompt = async (contentToSend: string) => {
      if (!workspaceId || !contentToSend.trim() || isStreaming) return

      const trimmed = contentToSend.trim()
      setPromptText('')

      let currentThreadId = activeThreadId

      if (!currentThreadId) {
        const newThread = await createThreadMutation.mutateAsync({
          title: trimmed.slice(0, 32),
        })
        currentThreadId = newThread.id as AssistantThreadId
        onThreadCreated(currentThreadId)
      }

      await onSendMessage(trimmed)
    }

    return (
      <div className="border-t bg-background p-3">
        <PromptInput
          value={promptText}
          onChange={setPromptText}
          onSubmit={handleSendPrompt}
          onStop={onStop}
          isStreaming={isStreaming}
          placeholder={m.ai_assistant_placeholder()}
        />
      </div>
    )
  },
  (prev, next) => {
    return (
      prev.workspaceId === next.workspaceId &&
      prev.activeThreadId === next.activeThreadId &&
      prev.isStreaming === next.isStreaming
    )
  },
)
