import { resultInfiniteQueryOptions } from '@/integrations/tanstack-query/better-result/query-options'
import { notificationsApi } from './api'

export const notificationsKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationsKeys.all, 'list'] as const,
}

export function notificationsInfiniteQueryOptions() {
  return resultInfiniteQueryOptions({
    queryKey: notificationsKeys.list(),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      notificationsApi.getNotifications({
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
  })
}
