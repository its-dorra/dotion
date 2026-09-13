import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import {
  Conversation,
  Message,
  TypingIndicator,
} from '@/components/ai-elements'
import { assistantMessagesInfiniteQueryOptions } from '../query-options'
import { AiAssistantEmptyState } from './ai-assistant-empty-state'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type {
  AssistantThreadId,
  AssistantCitation,
  AssistantMessage as AssistantMessageType,
  ToolPart,
} from '../types'

interface AiAssistantConversationProps {
  workspaceId: WorkspaceId
  activeThreadId: AssistantThreadId | null
  isStreaming: boolean
  streamingText: string
  toolParts?: ToolPart[]
  optimisticUserMessage: string | null
  onSendSuggestion?: (prompt: string) => void
}

export function AiAssistantConversation({
  workspaceId,
  activeThreadId,
  isStreaming,
  streamingText,
  toolParts,
  optimisticUserMessage,
  onSendSuggestion,
}: AiAssistantConversationProps) {
  const navigate = useNavigate()

  const messagesQuery = useInfiniteQuery(
    assistantMessagesInfiniteQueryOptions(
      workspaceId,
      activeThreadId as AssistantThreadId,
      {
        enabled: Boolean(workspaceId && activeThreadId),
      },
    ),
  )

  const messages = React.useMemo<AssistantMessageType[]>(() => {
    if (!messagesQuery.data) return []
    const all = messagesQuery.data.pages.flatMap((page) => page.items)
    return [...all].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }, [messagesQuery.data])

  const handleSelectCitation = React.useCallback(
    (citation: AssistantCitation) => {
      navigate({
        to: '/app/workspaces/$workspaceId/pages/$pageId',
        params: {
          workspaceId,
          pageId: citation.pageId,
        },
      }).then(() => {
        if (citation.headingBlockId && citation.headingBlockId !== 'root') {
          let attempts = 0
          const interval = setInterval(() => {
            attempts++
            const el =
              document.querySelector(
                `[data-id="${citation.headingBlockId}"]`,
              ) || document.getElementById(citation.headingBlockId!)
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              clearInterval(interval)
            } else if (attempts >= 10) {
              clearInterval(interval)
            }
          }, 150)
        }
      })
    },
    [workspaceId, navigate],
  )

  const showEmptyState =
    messages.length === 0 &&
    !optimisticUserMessage &&
    !streamingText &&
    !isStreaming

  return (
    <Conversation
      onLoadEarlier={() => messagesQuery.fetchNextPage()}
      hasEarlier={Boolean(messagesQuery.hasNextPage)}
      isLoadingEarlier={messagesQuery.isFetchingNextPage}
      className="flex-1 bg-muted/10"
    >
      {showEmptyState ? (
        <AiAssistantEmptyState
          onSelectSuggestion={(prompt) => onSendSuggestion?.(prompt)}
        />
      ) : (
        <div className="space-y-1 py-2">
          {messages.map((msg) => (
            <Message
              key={msg.id}
              id={msg.id}
              role={msg.role as 'user' | 'assistant'}
              content={msg.content}
              citations={msg.citations ?? undefined}
              toolParts={
                msg.toolCalls && msg.toolCalls.length > 0
                  ? (msg.toolCalls as unknown as ToolPart[])
                  : undefined
              }
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
              {streamingText || (toolParts && toolParts.length > 0) ? (
                <Message
                  id="streaming_assistant"
                  role="assistant"
                  content={streamingText}
                  toolParts={toolParts}
                  isStreaming={true}
                  onSelectCitation={handleSelectCitation}
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
  )
}
