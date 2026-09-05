import { resultQueryOptions } from '@/integrations/tanstack-query/better-result/query-options'
import { authorizationApi } from './api'
import type { CanParams } from './types'
import type {
  ResourceType,
  ResourceAction,
} from '@dotion/shared/authorization/types'

export const authorizationKeys = {
  all: ['authorization'] as const,
  check: (params: CanParams<ResourceType, any>) =>
    [...authorizationKeys.all, 'check', params] as const,
}

export function canQueryOptions<
  R extends ResourceType,
  A extends ResourceAction<R>,
>(params: CanParams<R, A>) {
  return resultQueryOptions({
    queryKey: authorizationKeys.check(params as any),
    queryFn: () => authorizationApi.checkPermission(params),
    staleTime: 30_000,
  })
}
