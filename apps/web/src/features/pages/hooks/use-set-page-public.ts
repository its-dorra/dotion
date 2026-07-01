import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { pagesApi } from "../api";
import { pagesKeys } from "../query-options";
import type { SetPagePublicInput } from "../types";

export function useSetPagePublic() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: SetPagePublicInput) => pagesApi.setPagePublic(input),
      onSuccess: (page) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.detail(page.id),
        });
      },
    }),
  );
}
