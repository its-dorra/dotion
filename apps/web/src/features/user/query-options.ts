import { resultQueryOptions } from "@/integrations/tanstack-query/better-result/query-options";
import { userApi } from "./api";

export const userKeys = {
  all: ["user"] as const,
  current: () => [...userKeys.all, "current"] as const,
};

export function currentUserQueryOptions() {
  return resultQueryOptions({
    queryKey: userKeys.current(),
    queryFn: () => userApi.getCurrentUser(),
    staleTime: 60_000,
  });
}
