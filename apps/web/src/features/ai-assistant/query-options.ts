import { resultInfiniteQueryOptions } from '@/integrations/tanstack-query/better-result/query-options'
import { aiAssistantApi } from './api'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId } from '@dotion/shared/ids'

export const assistantKeys = {
  all: ['assistant'] as const,
  workspace: (workspaceId: string) =>
    [...assistantKeys.all, 'workspace', workspaceId] as const,
  threads: (workspaceId: string) =>
    [...assistantKeys.workspace(workspaceId), 'threads'] as const,
  messages: (workspaceId: string, threadId: string) =>
    [
      ...assistantKeys.threads(workspaceId),
      'thread',
      threadId,
      'messages',
    ] as const,
}

export function assistantThreadsInfiniteQueryOptions(
  workspaceId: WorkspaceId,
  options?: { limit?: number; enabled?: boolean },
) {
  return resultInfiniteQueryOptions({
    queryKey: assistantKeys.threads(workspaceId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      aiAssistantApi.listThreads(workspaceId, {
        cursor: pageParam,
        limit: options?.limit ?? 20,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(workspaceId && (options?.enabled ?? true)),
    staleTime: 10_000,
  })
}

export function assistantMessagesInfiniteQueryOptions(
  workspaceId: WorkspaceId,
  threadId: AssistantThreadId,
  options?: { limit?: number; enabled?: boolean },
) {
  return resultInfiniteQueryOptions({
    queryKey: assistantKeys.messages(workspaceId, threadId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      aiAssistantApi.listMessages(workspaceId, threadId, {
        cursor: pageParam,
        limit: options?.limit ?? 25,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(workspaceId && threadId && (options?.enabled ?? true)),
    staleTime: 5_000,
  })
}
