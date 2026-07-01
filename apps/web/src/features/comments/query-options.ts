import { resultQueryOptions } from "@/integrations/tanstack-query/better-result/query-options";
import { commentsApi } from "./api";

export const commentsKeys = {
  all: ["comments"] as const,
  threads: (pageId: string) =>
    [...commentsKeys.all, "threads", pageId] as const,
};

export function commentThreadsQueryOptions(pageId: string) {
  return resultQueryOptions({
    queryKey: commentsKeys.threads(pageId),
    queryFn: () => commentsApi.getThreads(pageId),
    staleTime: 10_000,
    enabled: Boolean(pageId),
  });
}
