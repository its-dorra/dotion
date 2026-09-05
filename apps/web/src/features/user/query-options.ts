import { resultInfiniteQueryOptions } from '@/integrations/tanstack-query/better-result/query-options'
import { userApi } from './api'

export const userKeys = {
  all: ['users'] as const,
  search: (query: string) => [...userKeys.all, 'search', query] as const,
}

export function userSearchInfiniteQueryOptions({ query }: { query: string }) {
  return resultInfiniteQueryOptions({
    queryKey: userKeys.search(query),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      userApi.searchUsers({
        query,
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    enabled: Boolean(query.trim()),
  })
}
