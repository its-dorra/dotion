import { resultQueryOptions } from "@/integrations/tanstack-query/better-result/query-options";
import { pagesApi } from "./api";

export const pagesKeys = {
  all: ["pages"] as const,
  tree: (workspaceId: string) =>
    [...pagesKeys.all, "tree", workspaceId] as const,
  detail: (pageId: string) => [...pagesKeys.all, "detail", pageId] as const,
  trash: (workspaceId: string) =>
    [...pagesKeys.all, "trash", workspaceId] as const,
  permissions: (pageId: string) =>
    [...pagesKeys.all, "permissions", pageId] as const,
};

export function pageTreeQueryOptions(workspaceId: string) {
  return resultQueryOptions({
    queryKey: pagesKeys.tree(workspaceId),
    queryFn: () => pagesApi.getPageTree(workspaceId),
    staleTime: 15_000,
    enabled: Boolean(workspaceId),
  });
}

export function pageDetailQueryOptions(pageId: string) {
  return resultQueryOptions({
    queryKey: pagesKeys.detail(pageId),
    queryFn: () => pagesApi.getPage(pageId),
    staleTime: 10_000,
    enabled: Boolean(pageId),
  });
}

export function trashedPagesQueryOptions(workspaceId: string) {
  return resultQueryOptions({
    queryKey: pagesKeys.trash(workspaceId),
    queryFn: () => pagesApi.getTrashedPages(workspaceId),
    staleTime: 10_000,
    enabled: Boolean(workspaceId),
  });
}

export function pagePermissionsQueryOptions(pageId: string) {
  return resultQueryOptions({
    queryKey: pagesKeys.permissions(pageId),
    queryFn: () => pagesApi.getPagePermissions(pageId),
    staleTime: 15_000,
    enabled: Boolean(pageId),
  });
}
