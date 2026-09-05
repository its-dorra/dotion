import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { commentsApi } from '../api'
import type { DeleteCommentInput } from '../types'
import { commentsKeys } from '../query-options'

export type DeleteCommentVariables = DeleteCommentInput

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: DeleteCommentVariables) =>
        commentsApi.deleteComment(input.workspaceId, input),

      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({
          queryKey: commentsKeys.list(variables.workspaceId, variables.pageId),
        })
      },
    }),
  )
}
