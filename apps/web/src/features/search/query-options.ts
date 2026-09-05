import { resultQueryOptions } from '@/integrations/tanstack-query/better-result/query-options'
import { searchApi } from './api'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

export const searchKeys = {
  all: ['search'] as const,
  workspace: (workspaceId: string) =>
    [...searchKeys.all, 'workspace', workspaceId] as const,
  query: (workspaceId: string, q: string) =>
    [...searchKeys.workspace(workspaceId), 'q', q] as const,
}

export function searchQueryOptions(
  workspaceId: WorkspaceId,
  query: string,
  options?: { limit?: number; enabled?: boolean },
) {
  const trimmed = query.trim()
  return resultQueryOptions({
    queryKey: searchKeys.query(workspaceId, trimmed),
    queryFn: () =>
      searchApi.search(workspaceId, {
        q: trimmed,
        limit: options?.limit ?? 15,
      }),
    enabled: Boolean(workspaceId && trimmed && (options?.enabled ?? true)),
    staleTime: 30_000,
  })
}
