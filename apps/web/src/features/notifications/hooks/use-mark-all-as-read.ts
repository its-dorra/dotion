import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { notificationsApi } from "../api";
import { notificationsKeys } from "../query-options";

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: () => notificationsApi.markAllAsRead(),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notificationsKeys.list(),
        });
      },
    }),
  );
}
