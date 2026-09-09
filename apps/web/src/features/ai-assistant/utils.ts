import { isTextUIPart } from 'ai'
import type { QueryClient, InfiniteData } from '@tanstack/react-query'
import { assistantKeys } from './query-options'
import type {
  ChatMessage,
  AssistantCitation,
  AssistantMessage,
  AssistantMessageId,
  AssistantThreadId,
  PaginatedMessagesResponse,
  WorkspaceId,
} from './types'

export function getUIMessageText(msg?: ChatMessage): string {
  if (!msg) return ''
  return msg.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join('\n')
}

export function extractCitationsFromUIMessage(
  message: ChatMessage,
): AssistantCitation[] {
  const citations: AssistantCitation[] = []

  for (const part of message.parts) {
    if (
      part.type === 'tool-searchWorkspace' &&
      part.state === 'output-available' &&
      Array.isArray(part.output.items)
    ) {
      for (const item of part.output.items) {
        if (item.pageId && item.pageTitle) {
          citations.push({
            pageId: item.pageId,
            pageTitle: item.pageTitle,
            sectionTitle: item.sectionTitle ?? item.pageTitle,
            headingBlockId: item.headingBlockId ?? 'root',
          })
        }
      }
    }
  }

  return citations
}

export function optimisticallyUpdateThreadMessagesCache({
  queryClient,
  workspaceId,
  threadId,
  userMessage,
  assistantMessage,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  threadId: AssistantThreadId
  userMessage: ChatMessage
  assistantMessage: ChatMessage
}): void {
  const userText = getUIMessageText(userMessage)
  const assistantText = getUIMessageText(assistantMessage)
  const citations = extractCitationsFromUIMessage(assistantMessage)
  const now = new Date()

  const optimisticUserMsg: AssistantMessage = {
    id: `user-${Date.now()}` as AssistantMessageId,
    threadId,
    role: 'user',
    content: userText,
    citations: null,
    tokensUsed: 0,
    createdAt: new Date(now.getTime() - 1000),
    updatedAt: new Date(now.getTime() - 1000),
  }

  const optimisticAssistantMsg: AssistantMessage = {
    id: (assistantMessage.id ?? `asst-${Date.now()}`) as AssistantMessageId,
    threadId,
    role: 'assistant',
    content: assistantText,
    citations: citations.length > 0 ? citations : null,
    tokensUsed: 0,
    createdAt: now,
    updatedAt: now,
  }

  queryClient.setQueryData<InfiniteData<PaginatedMessagesResponse>>(
    assistantKeys.messages(workspaceId, threadId),
    (oldData) => {
      if (!oldData || oldData.pages.length === 0) {
        return {
          pages: [
            {
              items: [optimisticAssistantMsg, optimisticUserMsg],
              nextCursor: null,
              hasMore: false,
            },
          ],
          pageParams: [undefined],
        }
      }

      const firstPage = oldData.pages[0]!
      const updatedFirstPage = {
        ...firstPage,
        items: [
          optimisticAssistantMsg,
          optimisticUserMsg,
          ...firstPage.items,
        ],
      }

      return {
        ...oldData,
        pages: [updatedFirstPage, ...oldData.pages.slice(1)],
      }
    },
  )
}
