import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { workspacesApi } from "../api";
import { workspacesKeys } from "../query-options";
import type { UpdateWorkspaceInput } from "../types";

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: UpdateWorkspaceInput) =>
        workspacesApi.updateWorkspace(input),
      onSuccess: (workspace) => {
        queryClient.invalidateQueries({ queryKey: workspacesKeys.list() });
        queryClient.invalidateQueries({
          queryKey: workspacesKeys.detail(workspace.id),
        });
      },
    }),
  );
}
