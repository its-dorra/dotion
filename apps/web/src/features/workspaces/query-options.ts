import {
  resultQueryOptions,
  resultInfiniteQueryOptions,
} from '@/integrations/tanstack-query/better-result/query-options'
import { workspacesApi } from './api'
import type { WorkspaceId } from './types'

export const workspacesKeys = {
  all: ['workspaces'] as const,
  list: () => [...workspacesKeys.all, 'list'] as const,
  detail: (workspaceId: WorkspaceId) =>
    [...workspacesKeys.all, 'detail', workspaceId] as const,
  members: (workspaceId: WorkspaceId) =>
    [...workspacesKeys.all, 'members', workspaceId] as const,
  workspaceInvitations: (workspaceId: WorkspaceId) =>
    [...workspacesKeys.all, 'workspace-invitations', workspaceId] as const,
  candidateUsers: (workspaceId: WorkspaceId, query: string) =>
    [...workspacesKeys.all, 'candidate-users', workspaceId, query] as const,
}

export function workspacesListQueryOptions() {
  return resultQueryOptions({
    queryKey: workspacesKeys.list(),
    queryFn: () => workspacesApi.getWorkspaces(),
  })
}

export function workspaceDetailQueryOptions(workspaceId: WorkspaceId) {
  return resultQueryOptions({
    queryKey: workspacesKeys.detail(workspaceId),
    queryFn: () => workspacesApi.getWorkspace(workspaceId),
  })
}

export function workspaceMembersQueryOptions(workspaceId: WorkspaceId) {
  return resultQueryOptions({
    queryKey: workspacesKeys.members(workspaceId),
    queryFn: () => workspacesApi.getMembers(workspaceId),
  })
}

export function workspaceMembersInfiniteQueryOptions(workspaceId: WorkspaceId) {
  return resultInfiniteQueryOptions({
    queryKey: workspacesKeys.members(workspaceId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      workspacesApi.getMembers(workspaceId, {
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    enabled: Boolean(workspaceId),
  })
}

export function workspaceInvitationsQueryOptions(workspaceId: WorkspaceId) {
  return resultQueryOptions({
    queryKey: workspacesKeys.workspaceInvitations(workspaceId),
    queryFn: () => workspacesApi.getWorkspaceInvitations(workspaceId),
    enabled: Boolean(workspaceId),
  })
}

export function workspaceInvitationsInfiniteQueryOptions(
  workspaceId: WorkspaceId,
) {
  return resultInfiniteQueryOptions({
    queryKey: workspacesKeys.workspaceInvitations(workspaceId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      workspacesApi.getWorkspaceInvitations(workspaceId, {
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    enabled: Boolean(workspaceId),
  })
}

export function pendingInvitationsInfiniteQueryOptions(
  workspaceId: WorkspaceId,
) {
  return resultInfiniteQueryOptions({
    queryKey: workspacesKeys.workspaceInvitations(workspaceId),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      workspacesApi.getWorkspaceInvitations(workspaceId, {
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
  })
}

export function workspaceCandidateUsersInfiniteQueryOptions({
  workspaceId,
  query,
}: {
  workspaceId: WorkspaceId
  query: string
}) {
  return resultInfiniteQueryOptions({
    queryKey: workspacesKeys.candidateUsers(workspaceId, query),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      workspacesApi.searchCandidateUsers({
        workspaceId,
        query,
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    enabled: Boolean(workspaceId && query.trim()),
  })
}
