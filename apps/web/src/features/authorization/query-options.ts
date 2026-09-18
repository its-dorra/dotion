import { resultQueryOptions } from '@/integrations/tanstack-query/better-result/query-options'
import { authorizationApi } from './api'
import type {
  ResourceType,
  ResourceAction,
  CanParams,
} from '@dotion/shared/authorization/types'
import type { WorkspaceId } from '../workspaces/types'

export const authorizationKeys = {
  all: ['authorization'] as const,
  resource: (resourceType: string, resourceId?: string) =>
    resourceId
      ? ([...authorizationKeys.all, resourceType, resourceId] as const)
      : ([...authorizationKeys.all, resourceType] as const),
  page: (pageId: string) => [...authorizationKeys.all, 'page', pageId] as const,
  workspace: (workspaceId: WorkspaceId) =>
    [...authorizationKeys.all, 'workspace', workspaceId] as const,
  check: <R extends ResourceType, A extends ResourceAction<R>>(
    params: CanParams<R, A>,
  ) => {
    if (typeof params.resource === 'object' && 'id' in params.resource) {
      const type = params.resource.type
      const idObj = params.resource.id as Record<string, unknown>
      const id = Object.values(idObj)[0]
      return [
        ...authorizationKeys.all,
        type,
        String(id),
        String(params.action),
        params,
      ] as const
    }
    if ('container' in params && params.container) {
      const containerObj = params.container as Record<string, unknown>
      if ('pageId' in containerObj && containerObj.pageId) {
        return [
          ...authorizationKeys.all,
          'page',
          String(containerObj.pageId),
          `${String(params.resource)}:${String(params.action)}`,
          params,
        ] as const
      }
      if ('workspaceId' in containerObj && containerObj.workspaceId) {
        return [
          ...authorizationKeys.all,
          'workspace',
          String(containerObj.workspaceId),
          `${String(params.resource)}:${String(params.action)}`,
          params,
        ] as const
      }
    }
    return [
      ...authorizationKeys.all,
      String(params.resource),
      'collection',
      String(params.action),
      params,
    ] as const
  },
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
