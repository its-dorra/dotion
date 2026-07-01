import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { pagesApi } from "../api";
import { pagesKeys } from "../query-options";
import type { CreatePageInput } from "../types";

export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: CreatePageInput) => pagesApi.createPage(input),
      onSuccess: (page) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.tree(page.workspaceId),
        });
      },
    }),
  );
}
