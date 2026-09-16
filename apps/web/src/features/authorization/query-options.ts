import { resultQueryOptions } from '@/integrations/tanstack-query/better-result/query-options'
import { authorizationApi } from './api'
import type {
  ResourceType,
  ResourceAction,
  CanParams,
} from '@dotion/shared/authorization/types'

export const authorizationKeys = {
  all: ['authorization'] as const,
  check: <R extends ResourceType, A extends ResourceAction<R>>(
    params: CanParams<R, A>,
  ) => [...authorizationKeys.all, 'check', params] as const,
}

export function canQueryOptions<
  R extends ResourceType,
  A extends ResourceAction<R>,
>(params: CanParams<R, A>) {
  return resultQueryOptions({
    queryKey: authorizationKeys.check(params),
    queryFn: () => authorizationApi.checkPermission(params),
    staleTime: 30_000,
  })
}
