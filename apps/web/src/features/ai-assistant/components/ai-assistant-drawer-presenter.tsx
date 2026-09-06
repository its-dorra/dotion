import * as React from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { AiAssistantHeader } from './ai-assistant-header'
import { AiAssistantConversation } from './ai-assistant-conversation'
import { AiAssistantInput } from './ai-assistant-input'
import { useStreamAssistantChat } from '../hooks/use-stream-assistant-chat'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId } from '../types'

interface AiAssistantDrawerPresenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: WorkspaceId
}

export function AiAssistantDrawerPresenter({
  open,
  onOpenChange,
  workspaceId,
}: AiAssistantDrawerPresenterProps) {
  const [activeThreadId, setActiveThreadId] =
    React.useState<AssistantThreadId | null>(null)

  const streamChat = useStreamAssistantChat(workspaceId)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col h-full bg-background border-l shadow-2xl z-50"
      >
        <AiAssistantHeader
          workspaceId={workspaceId}
          activeThreadId={activeThreadId}
          onSelectThread={setActiveThreadId}
        />

        <AiAssistantConversation
          workspaceId={workspaceId}
          activeThreadId={activeThreadId}
          isStreaming={streamChat.isStreaming}
          streamingText={streamChat.streamingText}
          optimisticUserMessage={streamChat.optimisticUserMessage}
        />

        <AiAssistantInput
          workspaceId={workspaceId}
          activeThreadId={activeThreadId}
          onThreadCreated={setActiveThreadId}
          streamChat={streamChat}
        />
      </SheetContent>
    </Sheet>
  )
}
