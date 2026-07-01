import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { workspacesApi } from "../api";
import { workspacesKeys } from "../query-options";
import type { AcceptInvitationInput } from "../types";

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: AcceptInvitationInput) =>
        workspacesApi.acceptInvitation(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: workspacesKeys.list() });
        queryClient.invalidateQueries({
          queryKey: workspacesKeys.invitations(),
        });
      },
    }),
  );
}
