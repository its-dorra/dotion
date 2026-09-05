import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { pagesApi } from "../api";
import { pagesKeys } from "../query-options";
import type { DeletePermanentlyInput } from "../types";

interface DeletePermanentlyVariables extends DeletePermanentlyInput {
  workspaceId: string;
}

export function useDeletePermanently() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: DeletePermanentlyVariables) =>
        pagesApi.deletePermanently(input),
      onSuccess: (_result, variables) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.trash(variables.workspaceId),
        });
      },
    }),
  );
}
