import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { workspacesApi } from "../api";
import { workspacesKeys } from "../query-options";
import type { InviteMemberInput } from "../types";

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: InviteMemberInput) =>
        workspacesApi.inviteMember(input),
      onSuccess: (_invitation, variables) => {
        queryClient.invalidateQueries({
          queryKey: workspacesKeys.members(variables.workspaceId),
        });
      },
    }),
  );
}
