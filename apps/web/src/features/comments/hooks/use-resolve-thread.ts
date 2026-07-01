import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { commentsApi } from "../api";
import { commentsKeys } from "../query-options";
import type { ResolveThreadInput } from "../types";

interface ResolveThreadVariables extends ResolveThreadInput {
  pageId: string;
}

export function useResolveThread() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: ResolveThreadVariables) =>
        commentsApi.resolveThread(input),
      onSuccess: (_thread, variables) => {
        queryClient.invalidateQueries({
          queryKey: commentsKeys.threads(variables.pageId),
        });
      },
    }),
  );
}
