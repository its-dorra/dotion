import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { commentsApi } from '../api'
import type { DeleteCommentInput } from '../types'
import { commentsInfiniteQueryOptions } from '../query-options'
import { handleCommentDeletedWsMessage } from '../utils'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'

export type DeleteCommentVariables = DeleteCommentInput

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: DeleteCommentVariables) =>
        commentsApi.deleteComment(input.workspaceId, input),
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: commentsInfiniteQueryOptions(
            variables.workspaceId,
            variables.pageId,
          ).queryKey,
        })
        const previousComments = queryClient.getQueryData(
          commentsInfiniteQueryOptions(variables.workspaceId, variables.pageId)
            .queryKey,
        )
        handleCommentDeletedWsMessage({
          queryClient,
          workspaceId: variables.workspaceId,
          pageId: variables.pageId,
          payload: {
            commentId: variables.commentId,
            isRoot: !variables.parentId,
            parentId: variables.parentId ?? null,
          },
        })
        return { previousComments }
      },
      onError: (error, variables, context) => {
        if (context?.previousComments) {
          queryClient.setQueryData(
            commentsInfiniteQueryOptions(
              variables.workspaceId,
              variables.pageId,
            ).queryKey,
            context.previousComments,
          )
        }
        toast.error(error?.message ?? m.toast_comment_delete_failed())
      },
      onSuccess: () => {
        toast.success(m.toast_comment_deleted())
      },
    }),
  )
}
