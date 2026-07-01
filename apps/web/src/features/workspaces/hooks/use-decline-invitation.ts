import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { workspacesApi } from "../api";
import { workspacesKeys } from "../query-options";
import type { AcceptInvitationInput } from "../types";

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: AcceptInvitationInput) =>
        workspacesApi.declineInvitation(input),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: workspacesKeys.invitations(),
        });
      },
    }),
  );
}
