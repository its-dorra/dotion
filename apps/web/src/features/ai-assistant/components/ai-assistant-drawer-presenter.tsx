import * as React from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  MessageSquare,
  Bot,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Conversation,
  Message,
  PromptInput,
  Suggestions,
  TypingIndicator,
} from '@/components/ai-elements'
import {
  assistantThreadsInfiniteQueryOptions,
  assistantMessagesInfiniteQueryOptions,
  assistantKeys,
} from '../query-options'
import { useCreateAssistantThread } from '../hooks/use-create-assistant-thread'
import { useDeleteAssistantThread } from '../hooks/use-delete-assistant-thread'
import { aiAssistantApi } from '../api'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type {
  AssistantThreadId,
  AssistantCitation,
  AssistantMessage as AssistantMessageType,
} from '../types'
import { toast } from 'sonner'

interface AiAssistantDrawerPresenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId?: WorkspaceId
}

export function AiAssistantDrawerPresenter({
  open,
  onOpenChange,
  workspaceId: propWorkspaceId,
}: AiAssistantDrawerPresenterProps) {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const workspaceId =
    propWorkspaceId ?? (params.workspaceId as WorkspaceId | undefined)

  const [activeThreadId, setActiveThreadId] =
    React.useState<AssistantThreadId | null>(null)
  const [promptText, setPromptText] = React.useState('')
  const [streamingText, setStreamingText] = React.useState('')
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [optimisticUserMessage, setOptimisticUserMessage] = React.useState<
    string | null
  >(null)

  const abortControllerRef = React.useRef<AbortController | null>(null)

  // 1. Threads query
  const threadsQuery = useInfiniteQuery(
    assistantThreadsInfiniteQueryOptions(workspaceId as WorkspaceId, {
      enabled: Boolean(workspaceId && open),
    }),
  )

  const threads = React.useMemo(() => {
    return threadsQuery.data?.pages.flatMap((page) => page.items) ?? []
  }, [threadsQuery.data])

  // Select first thread by default if none selected
  React.useEffect(() => {
    if (threads.length > 0 && !activeThreadId) {
      setActiveThreadId(threads[0]?.id as AssistantThreadId)
    }
  }, [threads, activeThreadId])

  const activeThread = React.useMemo(() => {
    return threads.find((t) => t.id === activeThreadId)
  }, [threads, activeThreadId])

  // 2. Messages query
  const messagesQuery = useInfiniteQuery(
    assistantMessagesInfiniteQueryOptions(
      workspaceId as WorkspaceId,
      activeThreadId as AssistantThreadId,
      {
        enabled: Boolean(workspaceId && activeThreadId && open),
      },
    ),
  )

  const messages = React.useMemo<AssistantMessageType[]>(() => {
    if (!messagesQuery.data) return []
    // Messages in infinite queries come in pages (recent first or oldest first)
    const all = messagesQuery.data.pages.flatMap((page) => page.items)
    // Sort chronologically (oldest to newest) for conversation display
    return [...all].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }, [messagesQuery.data])

  // 3. Thread mutations
  const createThreadMutation = useCreateAssistantThread(
    workspaceId as WorkspaceId,
  )
  const deleteThreadMutation = useDeleteAssistantThread(
    workspaceId as WorkspaceId,
  )

  const handleCreateNewThread = async () => {
    if (!workspaceId) return
    try {
      const thread = await createThreadMutation.mutateAsync({
        title: 'New Chat',
      })
      setActiveThreadId(thread.id as AssistantThreadId)
      setStreamingText('')
      setOptimisticUserMessage(null)
    } catch {
      // Handled by hook
    }
  }

  const handleDeleteThread = async (
    e: React.MouseEvent,
    threadId: AssistantThreadId,
  ) => {
    e.stopPropagation()
    if (!workspaceId) return
    try {
      await deleteThreadMutation.mutateAsync(threadId)
      if (activeThreadId === threadId) {
        const remaining = threads.filter((t) => t.id !== threadId)
        setActiveThreadId((remaining[0]?.id as AssistantThreadId) ?? null)
      }
    } catch {
      // Handled by hook
    }
  }

  // 4. Citation selection / deep link navigation
  const handleSelectCitation = React.useCallback(
    (citation: AssistantCitation) => {
      if (!workspaceId) return
      navigate({
        to: '/app/workspaces/$workspaceId/pages/$pageId',
        params: {
          workspaceId,
          pageId: citation.pageId,
        },
      }).then(() => {
        if (citation.headingBlockId) {
          setTimeout(() => {
            const el = document.getElementById(citation.headingBlockId!)
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 300)
        }
      })
    },
    [workspaceId, navigate],
  )

  // 5. Submit chat prompt
  const handleSendPrompt = async (contentToSend: string) => {
    if (!workspaceId || !contentToSend.trim() || isStreaming) return

    const trimmed = contentToSend.trim()
    setPromptText('')
    setOptimisticUserMessage(trimmed)
    setStreamingText('')
    setIsStreaming(true)

    let currentThreadId = activeThreadId

    // Auto-create thread if none exists
    if (!currentThreadId) {
      try {
        const newThread = await createThreadMutation.mutateAsync({
          title: trimmed.slice(0, 32),
        })
        currentThreadId = newThread.id as AssistantThreadId
        setActiveThreadId(currentThreadId)
      } catch (err) {
        setIsStreaming(false)
        setOptimisticUserMessage(null)
        toast.error('Could not initialize conversation.')
        return
      }
    }

    const isFirstTurn =
      messages.length === 0 ||
      !activeThread ||
      activeThread.title === 'New Chat' ||
      !activeThread.title

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const result = await aiAssistantApi.streamChat(
      workspaceId,
      currentThreadId,
      trimmed,
      {
        signal: abortController.signal,
        onChunk: (chunk) => {
          setStreamingText((prev) => prev + chunk)
        },
        onFinish: () => {
          setIsStreaming(false)
          setOptimisticUserMessage(null)
          setStreamingText('')

          if (workspaceId && currentThreadId) {
            // Always refresh messages for current thread to pull persisted citations
            queryClient.invalidateQueries({
              queryKey: assistantKeys.messages(workspaceId, currentThreadId),
            })

            // Only refresh the threads list on the first turn when a new title is generated
            if (isFirstTurn) {
              queryClient.invalidateQueries({
                queryKey: assistantKeys.threads(workspaceId),
              })
            }
          }
        },
      },
    )

    if (result.isErr()) {
      setIsStreaming(false)
      setOptimisticUserMessage(null)
      result.error.match({
        QuotaExceededError: (err) => {
          toast.error(err.message || 'Daily AI token limit reached.')
        },
        ThreadNotFoundError: () => {
          toast.error('Conversation thread was deleted.')
        },
        AuthenticationError: () => {
          toast.error('Please log in again.')
        },
        AuthorizationError: () => {
          toast.error('You do not have access to this workspace.')
        },
        AssistantError: (err) => {
          toast.error(err.message)
        },
        AppError: (err) => {
          toast.error(err.message)
        },
      })
    }
  }

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort()
    setIsStreaming(false)
  }

  if (!workspaceId) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-lg md:max-w-xl border-l shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between border-b px-4 py-3 space-y-0 bg-background/95 backdrop-blur-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <SheetTitle className="text-xs font-semibold leading-none flex items-center gap-1.5 truncate">
                <span>Dotion Assistant</span>
              </SheetTitle>
              <span className="text-[10px] text-muted-foreground truncate">
                RAG Workspace Knowledge
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pr-6">
            {/* Thread selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 max-w-[140px] px-2 font-normal"
                >
                  <MessageSquare className="size-3 text-muted-foreground shrink-0" />
                  <span
                    key={activeThread?.title || 'conversations'}
                    className="truncate animate-in fade-in slide-in-from-top-1 duration-300"
                  >
                    {activeThread?.title || 'Conversations'}
                  </span>
                  <ChevronDown className="size-3 opacity-50 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-xs">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Conversations
                </div>
                {threads.length === 0 ? (
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  threads.map((t) => (
                    <DropdownMenuItem
                      key={t.id}
                      onClick={() =>
                        setActiveThreadId(t.id as AssistantThreadId)
                      }
                      className="flex items-center justify-between gap-2 group cursor-pointer"
                    >
                      <span className="truncate">{t.title}</span>
                      <button
                        type="button"
                        onClick={(e) =>
                          handleDeleteThread(e, t.id as AssistantThreadId)
                        }
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-xs hover:bg-destructive/20 hover:text-destructive transition-opacity"
                        title="Delete chat"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleCreateNewThread}
                  className="gap-2 cursor-pointer font-medium text-primary focus:text-primary"
                >
                  <Plus className="size-3.5" />
                  <span>New Conversation</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCreateNewThread}
              className="size-7 text-muted-foreground hover:text-foreground"
              title="New Chat"
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        {/* Conversation Viewport */}
        <Conversation
          onLoadEarlier={() => messagesQuery.fetchNextPage()}
          hasEarlier={Boolean(messagesQuery.hasNextPage)}
          isLoadingEarlier={messagesQuery.isFetchingNextPage}
          className="flex-1 bg-muted/10"
        >
          {messages.length === 0 &&
          !optimisticUserMessage &&
          !streamingText &&
          !isStreaming ? (
            <div className="flex h-full flex-col justify-between py-6 px-2 space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col items-center justify-center text-center pt-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-3 shadow-xs">
                  <Bot className="size-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Ask Dotion Assistant
                </h3>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
                  Query across all workspace documents, notes, meeting logs, and
                  roadmaps with verified source citations.
                </p>
              </div>

              <div className="pt-4">
                <Suggestions
                  onSelectSuggestion={(prompt) => handleSendPrompt(prompt)}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  id={msg.id}
                  role={msg.role as 'user' | 'assistant'}
                  content={msg.content}
                  citations={msg.citations ?? undefined}
                  tokensUsed={msg.tokensUsed ?? undefined}
                  createdAt={msg.createdAt}
                  onSelectCitation={handleSelectCitation}
                />
              ))}

              {optimisticUserMessage && (
                <Message
                  id="optimistic_user"
                  role="user"
                  content={optimisticUserMessage}
                />
              )}

              {isStreaming && (
                <>
                  {streamingText ? (
                    <Message
                      id="streaming_assistant"
                      role="assistant"
                      content={streamingText}
                      isStreaming={true}
                    />
                  ) : (
                    <div className="py-2 pl-2">
                      <TypingIndicator statusText="Searching workspace and synthesizing answer..." />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </Conversation>

        {/* Input Footer */}
        <div className="border-t bg-background p-3">
          <PromptInput
            value={promptText}
            onChange={setPromptText}
            onSubmit={handleSendPrompt}
            onStop={handleStopStreaming}
            isStreaming={isStreaming}
            disabled={!workspaceId}
            placeholder="Ask about project roadmaps, architectures, or meeting notes..."
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
