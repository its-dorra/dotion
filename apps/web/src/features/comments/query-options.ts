import {
  resultQueryOptions,
  resultInfiniteQueryOptions,
} from '@/integrations/tanstack-query/better-result/query-options'
import { commentsApi } from './api'
import type { PageId } from '../pages/types'
import type { WorkspaceId } from '../workspaces/types'

export const commentsKeys = {
  all: ['comments'] as const,
  list: (workspaceId: WorkspaceId, pageId: PageId) =>
    [...commentsKeys.all, 'list', workspaceId, pageId] as const,
}

export function commentsQueryOptions(workspaceId: WorkspaceId, pageId: PageId) {
  return resultQueryOptions({
    queryKey: commentsKeys.list(workspaceId, pageId),
    queryFn: () =>
      commentsApi.getComments(workspaceId, pageId, { page: 1, limit: 50 }),
  })
}

export function commentsInfiniteQueryOptions(
  workspaceId: WorkspaceId,
  pageId: PageId,
) {
  return resultInfiniteQueryOptions({
    queryKey: commentsKeys.list(workspaceId, pageId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      commentsApi.getComments(workspaceId, pageId, {
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
  })
}
