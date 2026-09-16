import * as React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Plus, Trash2, ChevronDown, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { assistantThreadsInfiniteQueryOptions } from '../query-options'
import { useCreateAssistantThread } from '../hooks/use-create-assistant-thread'
import { useDeleteAssistantThread } from '../hooks/use-delete-assistant-thread'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId } from '../types'

interface AiAssistantThreadSelectorProps {
  workspaceId: WorkspaceId
  activeThreadId: AssistantThreadId | null
  onSelectThread: (threadId: AssistantThreadId | null) => void
}

export function AiAssistantThreadSelector({
  workspaceId,
  activeThreadId,
  onSelectThread,
}: AiAssistantThreadSelectorProps) {
  const threadsQuery = useInfiniteQuery(
    assistantThreadsInfiniteQueryOptions(workspaceId, {
      enabled: Boolean(workspaceId),
    }),
  )
  const createThreadMutation = useCreateAssistantThread(workspaceId)
  const deleteThreadMutation = useDeleteAssistantThread(workspaceId)

  const threads = React.useMemo(() => {
    return threadsQuery.data?.pages.flatMap((page) => page.items) ?? []
  }, [threadsQuery.data])

  const effectiveActiveThreadId =
    activeThreadId ?? (threads[0]?.id as AssistantThreadId | undefined)

  const activeThread = React.useMemo(() => {
    return threads.find((t) => t.id === effectiveActiveThreadId)
  }, [threads, effectiveActiveThreadId])

  const handleCreateNewThread = async () => {
    const thread = await createThreadMutation.mutateAsync({})
    onSelectThread(thread.id as AssistantThreadId)
  }

  const handleDeleteThread = async (
    e: React.MouseEvent,
    threadId: AssistantThreadId,
  ) => {
    e.stopPropagation()
    await deleteThreadMutation.mutateAsync(threadId)
    if (effectiveActiveThreadId === threadId) {
      const remaining = threads.filter((t) => t.id !== threadId)
      onSelectThread((remaining[0]?.id as AssistantThreadId) ?? null)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 max-w-35 px-2 font-normal"
          >
            <MessageSquare className="size-3 text-muted-foreground shrink-0" />
            <span className="truncate animate-in fade-in slide-in-from-top-1 duration-300">
              {activeThread?.title || m.ai_assistant_conversations()}
            </span>
            <ChevronDown className="size-3 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 text-xs">
          <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {m.ai_assistant_conversations()}
          </div>
          {threadsQuery.isError ? (
            <div className="px-2 py-3 text-center text-xs text-destructive space-y-1.5">
              <p>{m.error_assistant_threads_failed()}</p>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-2"
                onClick={() => threadsQuery.refetch()}
              >
                {m.error_action_retry()}
              </Button>
            </div>
          ) : threads.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              {m.ai_assistant_history_empty_title()}
            </div>
          ) : (
            threads.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => onSelectThread(t.id as AssistantThreadId)}
                className={`flex items-center justify-between group cursor-pointer ${
                  t.id === effectiveActiveThreadId
                    ? 'bg-accent text-accent-foreground font-medium'
                    : ''
                }`}
              >
                <span className="truncate pr-2">
                  {t.title || m.ai_assistant_new_conversation()}
                </span>
                <button
                  onClick={(e) =>
                    handleDeleteThread(e, t.id as AssistantThreadId)
                  }
                  className="opacity-0 group-hover:opacity-100 hover:text-destructive p-0.5 rounded transition-opacity"
                  title={m.ai_assistant_delete_thread()}
                >
                  <Trash2 className="size-3" />
                </button>
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleCreateNewThread}
            className="gap-1.5 text-primary cursor-pointer"
          >
            <Plus className="size-3.5" />
            {m.ai_assistant_new_conversation()}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={handleCreateNewThread}
        title={m.ai_assistant_new_conversation()}
      >
        <Plus className="size-3.5" />
      </Button>
    </div>
  )
}
