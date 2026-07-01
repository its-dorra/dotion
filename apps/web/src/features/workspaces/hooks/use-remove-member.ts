import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { workspacesApi } from "../api";
import { workspacesKeys } from "../query-options";
import type { RemoveMemberInput } from "../types";

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: RemoveMemberInput) =>
        workspacesApi.removeMember(input),
      onSuccess: (_result, variables) => {
        queryClient.invalidateQueries({
          queryKey: workspacesKeys.members(variables.workspaceId),
        });
      },
    }),
  );
}
