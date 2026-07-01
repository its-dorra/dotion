import { resultQueryOptions } from "@/integrations/tanstack-query/better-result/query-options";
import { workspacesApi } from "./api";

export const workspacesKeys = {
  all: ["workspaces"] as const,
  list: () => [...workspacesKeys.all, "list"] as const,
  detail: (workspaceId: string) =>
    [...workspacesKeys.all, "detail", workspaceId] as const,
  members: (workspaceId: string) =>
    [...workspacesKeys.all, "members", workspaceId] as const,
  invitations: () => [...workspacesKeys.all, "invitations"] as const,
};

export function workspacesListQueryOptions() {
  return resultQueryOptions({
    queryKey: workspacesKeys.list(),
    queryFn: () => workspacesApi.getWorkspaces(),
    staleTime: 30_000,
  });
}

export function workspaceDetailQueryOptions(workspaceId: string) {
  return resultQueryOptions({
    queryKey: workspacesKeys.detail(workspaceId),
    queryFn: () => workspacesApi.getWorkspace(workspaceId),
    staleTime: 30_000,
    enabled: Boolean(workspaceId),
  });
}

export function workspaceMembersQueryOptions(workspaceId: string) {
  return resultQueryOptions({
    queryKey: workspacesKeys.members(workspaceId),
    queryFn: () => workspacesApi.getMembers(workspaceId),
    staleTime: 15_000,
    enabled: Boolean(workspaceId),
  });
}

export function pendingInvitationsQueryOptions() {
  return resultQueryOptions({
    queryKey: workspacesKeys.invitations(),
    queryFn: () => workspacesApi.getPendingInvitations(),
    staleTime: 15_000,
  });
}
