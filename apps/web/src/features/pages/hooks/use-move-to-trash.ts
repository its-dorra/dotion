import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { pagesApi } from "../api";
import { pagesKeys } from "../query-options";
import type { MoveToTrashInput } from "../types";

interface MoveToTrashVariables extends MoveToTrashInput {
  workspaceId: string;
}

export function useMoveToTrash() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: MoveToTrashVariables) =>
        pagesApi.moveToTrash(input),
      onSuccess: (_result, variables) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.tree(variables.workspaceId),
        });
        queryClient.invalidateQueries({
          queryKey: pagesKeys.trash(variables.workspaceId),
        });
      },
    }),
  );
}
