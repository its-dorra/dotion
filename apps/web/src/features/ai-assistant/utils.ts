import { isTextUIPart } from 'ai'
import type { QueryClient } from '@tanstack/react-query'
import {
  assistantThreadsInfiniteQueryOptions,
  assistantMessagesInfiniteQueryOptions,
} from './query-options'
import type {
  AssistantThread,
  ChatMessage,
  AssistantCitation,
  AssistantMessage,
  AssistantMessageId,
  AssistantThreadId,
  WorkspaceId,
  ToolPart,
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
  const toolParts = (assistantMessage.parts?.filter((part): part is ToolPart =>
    part.type.startsWith('tool-'),
  ) ?? []) as ToolPart[]
  const now = new Date()

  const optimisticUserMsg: AssistantMessage = {
    id: `user-${Date.now()}` as AssistantMessageId,
    threadId,
    role: 'user',
    content: userText,
    citations: null,
    toolCalls: null,
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
    toolCalls: toolParts.length > 0 ? toolParts : null,
    tokensUsed: 0,
    createdAt: now,
    updatedAt: now,
  }

  queryClient.setQueryData(
    assistantMessagesInfiniteQueryOptions(workspaceId, threadId).queryKey,
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
        items: [optimisticAssistantMsg, optimisticUserMsg, ...firstPage.items],
      }

      return {
        ...oldData,
        pages: [updatedFirstPage, ...oldData.pages.slice(1)],
      }
    },
  )
}

export function addThreadToCache({
  queryClient,
  workspaceId,
  thread,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  thread: AssistantThread
}): void {
  queryClient.setQueryData(
    assistantThreadsInfiniteQueryOptions(workspaceId).queryKey,
    (oldData) => {
      if (!oldData || oldData.pages.length === 0) {
        return {
          pages: [
            {
              items: [thread],
              nextCursor: null,
              hasMore: false,
            },
          ],
          pageParams: [undefined],
        }
      }

      const exists = oldData.pages.some((page) =>
        page.items.some((item) => item.id === thread.id),
      )
      if (exists) {
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === thread.id ? thread : item,
            ),
          })),
        }
      }

      const firstPage = oldData.pages[0]!
      return {
        ...oldData,
        pages: [
          {
            ...firstPage,
            items: [thread, ...firstPage.items],
          },
          ...oldData.pages.slice(1),
        ],
      }
    },
  )
}

export function removeThreadFromCache({
  queryClient,
  workspaceId,
  threadId,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  threadId: AssistantThreadId
}): void {
  queryClient.setQueryData(
    assistantThreadsInfiniteQueryOptions(workspaceId).queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== threadId),
        })),
      }
    },
  )
  queryClient.removeQueries({
    queryKey: assistantMessagesInfiniteQueryOptions(workspaceId, threadId)
      .queryKey,
  })
}

export function touchThreadInCache({
  queryClient,
  workspaceId,
  threadId,
  updatedAt = new Date(),
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  threadId: AssistantThreadId
  updatedAt?: Date
}): void {
  queryClient.setQueryData(
    assistantThreadsInfiniteQueryOptions(workspaceId).queryKey,
    (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.id === threadId ? { ...item, updatedAt } : item,
          ),
        })),
      }
    },
  )
}
