import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { commentsApi } from "../api";
import { commentsKeys } from "../query-options";
import type { CreateCommentInput } from "../types";

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: CreateCommentInput) =>
        commentsApi.createComment(input),
      onSuccess: (_thread, variables) => {
        queryClient.invalidateQueries({
          queryKey: commentsKeys.threads(variables.pageId),
        });
      },
    }),
  );
}
