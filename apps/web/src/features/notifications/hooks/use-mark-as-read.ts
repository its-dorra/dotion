import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { notificationsApi } from "../api";
import { notificationsKeys } from "../query-options";

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (notificationId: string) =>
        notificationsApi.markAsRead(notificationId),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notificationsKeys.list(),
        });
      },
    }),
  );
}
