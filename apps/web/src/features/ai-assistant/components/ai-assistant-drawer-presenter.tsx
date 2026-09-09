import * as React from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { AiAssistantHeader } from './ai-assistant-header'
import { AiAssistantConversation } from './ai-assistant-conversation'
import { AiAssistantInput } from './ai-assistant-input'
import { useAssistantChat } from '../hooks/use-assistant-chat'
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

  const chat = useAssistantChat({
    workspaceId,
    activeThreadId,
  })

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
          isStreaming={chat.isStreaming}
          streamingText={chat.streamingText}
          toolParts={chat.toolParts}
          optimisticUserMessage={chat.optimisticUserMessage}
        />

        <AiAssistantInput
          workspaceId={workspaceId}
          activeThreadId={activeThreadId}
          onThreadCreated={setActiveThreadId}
          onSendMessage={chat.sendMessage}
          onStop={chat.stop}
          isStreaming={chat.isStreaming}
        />
      </SheetContent>
    </Sheet>
  )
}
