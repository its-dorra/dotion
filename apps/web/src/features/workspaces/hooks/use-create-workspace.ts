import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { workspacesApi } from "../api";
import { workspacesKeys } from "../query-options";

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: { name: string; icon?: string }) =>
        workspacesApi.createWorkspace(input),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: workspacesKeys.list() });
      },
    }),
  );
}
