import {
  resultQueryOptions,
  resultInfiniteQueryOptions,
} from '@/integrations/tanstack-query/better-result/query-options'
import { searchApi } from './api'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { SearchMode } from './types'

export const searchKeys = {
  all: ['search'] as const,
  workspace: (workspaceId: string) =>
    [...searchKeys.all, 'workspace', workspaceId] as const,
  query: (
    workspaceId: string,
    q: string,
    limit = 15,
    mode: SearchMode = 'balanced',
  ) =>
    [
      ...searchKeys.workspace(workspaceId),
      'q',
      q,
      'limit',
      limit,
      'mode',
      mode,
    ] as const,
  infinite: (workspaceId: string, q: string, mode: SearchMode = 'balanced') =>
    [...searchKeys.workspace(workspaceId), 'infinite', q, mode] as const,
}

export function searchInfiniteQueryOptions(
  workspaceId: WorkspaceId,
  query: string,
  options?: { limit?: number; mode?: SearchMode; enabled?: boolean },
) {
  const trimmed = query.trim()
  const limit = options?.limit ?? 15
  const mode = options?.mode ?? 'balanced'

  return resultInfiniteQueryOptions({
    queryKey: searchKeys.infinite(workspaceId, trimmed, mode),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      searchApi.search(workspaceId, {
        q: trimmed,
        page: pageParam,
        limit,
        mode,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    enabled: Boolean(workspaceId && trimmed && (options?.enabled ?? true)),
    staleTime: 30_000,
  })
}

export function searchQueryOptions(
  workspaceId: WorkspaceId,
  query: string,
  options?: { limit?: number; mode?: SearchMode; enabled?: boolean },
) {
  const trimmed = query.trim()
  const limit = options?.limit ?? 15
  const mode = options?.mode ?? 'balanced'
  return resultQueryOptions({
    queryKey: searchKeys.query(workspaceId, trimmed, limit, mode),
    queryFn: () =>
      searchApi.search(workspaceId, {
        q: trimmed,
        page: 1,
        limit,
        mode,
      }),
    enabled: Boolean(workspaceId && trimmed && (options?.enabled ?? true)),
    staleTime: 30_000,
  })
}
