import { Sparkles } from 'lucide-react'
import { SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { AiAssistantThreadSelector } from './ai-assistant-thread-selector'
import * as m from '@/paraglide/messages'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId } from '../types'

interface AiAssistantHeaderProps {
  workspaceId: WorkspaceId
  activeThreadId: AssistantThreadId | null
  onSelectThread: (threadId: AssistantThreadId | null) => void
}

export function AiAssistantHeader({
  workspaceId,
  activeThreadId,
  onSelectThread,
}: AiAssistantHeaderProps) {
  return (
    <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3 space-y-0">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </div>
        <div className="flex flex-col">
          <SheetTitle className="text-sm font-semibold tracking-tight">
            {m.ai_assistant_ask_dotion()}
          </SheetTitle>
          <span className="text-[10px] text-muted-foreground truncate">
            {m.ai_assistant_rag_subtitle()}
          </span>
        </div>
      </div>

      <div className="pr-6">
        <AiAssistantThreadSelector
          workspaceId={workspaceId}
          activeThreadId={activeThreadId}
          onSelectThread={onSelectThread}
        />
      </div>
    </SheetHeader>
  )
}
