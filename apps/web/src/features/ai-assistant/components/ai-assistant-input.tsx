import * as React from 'react'
import { PromptInput } from '@/components/ai-elements'
import * as m from '@/paraglide/messages'

interface AiAssistantInputProps {
  onSendMessage: (content: string) => Promise<void>
  onStop: () => void
  isStreaming: boolean
}

export const AiAssistantInput = React.memo(
  ({ onSendMessage, onStop, isStreaming }: AiAssistantInputProps) => {
    const [promptText, setPromptText] = React.useState('')

    const handleSendPrompt = async (contentToSend: string) => {
      if (!contentToSend.trim() || isStreaming) return

      const trimmed = contentToSend.trim()
      setPromptText('')
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
      prev.isStreaming === next.isStreaming &&
      prev.onSendMessage === next.onSendMessage &&
      prev.onStop === next.onStop
    )
  },
)
