import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { workspacesApi } from "../api";
import { workspacesKeys } from "../query-options";
import type { UpdateMemberRoleInput } from "../types";

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: UpdateMemberRoleInput) =>
        workspacesApi.updateMemberRole(input),
      onSuccess: (_member, variables) => {
        queryClient.invalidateQueries({
          queryKey: workspacesKeys.members(variables.workspaceId),
        });
      },
    }),
  );
}
