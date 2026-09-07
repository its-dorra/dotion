import * as React from 'react'
import { PromptInput } from '@/components/ai-elements'
import { useCreateAssistantThread } from '../hooks/use-create-assistant-thread'
import * as m from '@/paraglide/messages'
import type { useStreamAssistantChat } from '../hooks/use-stream-assistant-chat'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId } from '../types'

interface AiAssistantInputProps {
  workspaceId: WorkspaceId
  activeThreadId: AssistantThreadId | null
  onThreadCreated: (threadId: AssistantThreadId) => void
  isFirstTurn?: boolean
  streamChat: ReturnType<typeof useStreamAssistantChat>
}

export function AiAssistantInput({
  workspaceId,
  activeThreadId,
  onThreadCreated,
  isFirstTurn = false,
  streamChat,
}: AiAssistantInputProps) {
  const [promptText, setPromptText] = React.useState('')
  const createThreadMutation = useCreateAssistantThread(workspaceId)

  const handleSendPrompt = async (contentToSend: string) => {
    if (!workspaceId || !contentToSend.trim() || streamChat.isStreaming) return

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

    await streamChat.mutateAsync({
      threadId: currentThreadId,
      content: trimmed,
      isFirstTurn: isFirstTurn || !activeThreadId,
    })
  }

  return (
    <div className="border-t bg-background p-3">
      <PromptInput
        value={promptText}
        onChange={setPromptText}
        onSubmit={handleSendPrompt}
        onStop={streamChat.stopStreaming}
        isStreaming={streamChat.isStreaming}
        placeholder={m.ai_assistant_placeholder()}
      />
    </div>
  )
}
