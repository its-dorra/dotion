import { resultQueryOptions } from "@/integrations/tanstack-query/better-result/query-options";
import { notificationsApi } from "./api";

export const notificationsKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationsKeys.all, "list"] as const,
};

export function notificationsListQueryOptions() {
  return resultQueryOptions({
    queryKey: notificationsKeys.list(),
    queryFn: () => notificationsApi.getNotifications(),
    staleTime: 10_000,
  });
}
