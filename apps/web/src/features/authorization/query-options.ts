import { resultQueryOptions } from '@/integrations/tanstack-query/better-result/query-options'
import { authorizationApi } from './api'
import type { Permission, CanParams } from '@dotion/shared/authorization/types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'
import type { UserId } from '@dotion/shared/users/types'

export const authorizationKeys = {
  all: ['authorization'] as const,
  user: (userId: UserId) => [...authorizationKeys.all, 'user', userId] as const,
  workspace: (workspaceId: WorkspaceId) =>
    [...authorizationKeys.all, 'workspace', workspaceId] as const,
  page: (pageId: PageId) => [...authorizationKeys.all, 'page', pageId] as const,
  check: <P extends Permission>(params: CanParams<P>) => {
    let scope: readonly [string, string] | readonly [string] = ['global']

    if ('container' in params && params.container) {
      const containerObj = params.container as Record<string, unknown>
      if ('pageId' in containerObj && containerObj.pageId) {
        scope = ['page', String(containerObj.pageId)]
      } else if ('workspaceId' in containerObj && containerObj.workspaceId) {
        scope = ['workspace', String(containerObj.workspaceId)]
      }
    } else if ('target' in params && params.target) {
      const targetObj = params.target as Record<string, unknown>
      if ('pageId' in targetObj && targetObj.pageId) {
        scope = ['page', String(targetObj.pageId)]
      } else if ('workspaceId' in targetObj && targetObj.workspaceId) {
        scope = ['workspace', String(targetObj.workspaceId)]
      }
    }

    return [
      ...authorizationKeys.all,
      ...scope,
      params.permission,
      params,
    ] as const
  },
}

export function canQueryOptions<P extends Permission>(params: CanParams<P>) {
  return resultQueryOptions({
    queryKey: authorizationKeys.check(params),
    queryFn: () => authorizationApi.checkPermission(params),
    staleTime: 30_000,
  })
}
