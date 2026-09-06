import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { commentsApi } from '../api'
import type { DeleteCommentInput } from '../types'
import { commentsKeys } from '../query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'

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
        toast.success(m.toast_comment_deleted())
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_comment_delete_failed())
      },
    }),
  )
}
