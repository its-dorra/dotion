import {
  resultQueryOptions,
  resultInfiniteQueryOptions,
} from '@/integrations/tanstack-query/better-result/query-options'
import { pagesApi } from './api'
import type { PageId } from '@dotion/shared/pages/types'
import type { WorkspaceId } from '../workspaces/types'

export const pagesKeys = {
  all: ['pages'] as const,
  tree: (workspaceId: string) =>
    [...pagesKeys.all, 'tree', workspaceId] as const,
  detail: (pageId: string) => [...pagesKeys.all, 'detail', pageId] as const,
  trash: (workspaceId: string) =>
    [...pagesKeys.all, 'trash', workspaceId] as const,
  permissions: (workspaceId: string, pageId: string) =>
    [...pagesKeys.all, 'permissions', workspaceId, pageId] as const,
  accessRequestStatus: (workspaceId: string, pageId: string) =>
    [...pagesKeys.all, 'access-request-status', workspaceId, pageId] as const,
}

export function pageTreeQueryOptions(workspaceId: WorkspaceId) {
  return resultQueryOptions({
    queryKey: pagesKeys.tree(workspaceId),
    queryFn: () => pagesApi.getPageTree(workspaceId),
  })
}

export function pageDetailQueryOptions(
  workspaceId: WorkspaceId,
  pageId: PageId,
) {
  return resultQueryOptions({
    queryKey: pagesKeys.detail(pageId),
    queryFn: () => pagesApi.getPage(workspaceId, pageId),
  })
}

export function pageAccessRequestStatusQueryOptions(
  workspaceId: WorkspaceId,
  pageId: PageId,
) {
  return resultQueryOptions({
    queryKey: pagesKeys.accessRequestStatus(workspaceId, pageId),
    queryFn: () => pagesApi.getAccessRequestStatus(workspaceId, pageId),
    staleTime: 10_000,
  })
}

export function trashedPagesQueryOptions(workspaceId: string) {
  return resultQueryOptions({
    queryKey: pagesKeys.trash(workspaceId),
    queryFn: () => pagesApi.getTrashedPages(workspaceId),
  })
}

export function pagePermissionsInfiniteQueryOptions(
  workspaceId: WorkspaceId,
  pageId: PageId,
) {
  return resultInfiniteQueryOptions({
    queryKey: pagesKeys.permissions(workspaceId, pageId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      pagesApi.getPagePermissions(workspaceId, pageId, {
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
  })
}
