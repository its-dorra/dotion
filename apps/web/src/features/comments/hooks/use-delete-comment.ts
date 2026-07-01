import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resultMutationOptions } from "@/integrations/tanstack-query/better-result/mutation-options";
import { commentsApi } from "../api";
import { commentsKeys } from "../query-options";
import type { DeleteCommentInput } from "../types";

interface DeleteCommentVariables extends DeleteCommentInput {
  pageId: string;
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: DeleteCommentVariables) =>
        commentsApi.deleteComment(input),
      onSuccess: (_result, variables) => {
        queryClient.invalidateQueries({
          queryKey: commentsKeys.threads(variables.pageId),
        });
      },
    }),
  );
}
