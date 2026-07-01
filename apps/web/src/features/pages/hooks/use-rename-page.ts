import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { pagesApi } from "../api";
import { pagesKeys } from "../query-options";
import type { RenamePageInput } from "../types";

export function useRenamePage() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: RenamePageInput) => pagesApi.renamePage(input),
      onSuccess: (page) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.tree(page.workspaceId),
        });
        queryClient.invalidateQueries({
          queryKey: pagesKeys.detail(page.id),
        });
      },
    }),
  );
}
