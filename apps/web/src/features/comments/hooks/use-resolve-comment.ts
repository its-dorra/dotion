import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { commentsApi } from '../api'
import type { ResolveCommentInput } from '../types'
import { commentsInfiniteQueryOptions } from '../query-options'
import { handleCommentResolvedWsMessage } from '../utils'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'

export type ResolveCommentVariables = ResolveCommentInput

export function useResolveComment() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: ResolveCommentVariables) =>
        commentsApi.resolveComment(input.workspaceId, input),
      onMutate: async (vars) => {
        await queryClient.cancelQueries({
          queryKey: commentsInfiniteQueryOptions(vars.workspaceId, vars.pageId)
            .queryKey,
        })
        const previousComments = queryClient.getQueryData(
          commentsInfiniteQueryOptions(vars.workspaceId, vars.pageId).queryKey,
        )
        handleCommentResolvedWsMessage({
          queryClient,
          workspaceId: vars.workspaceId,
          pageId: vars.pageId,
          payload: { commentId: vars.commentId },
        })
        return { previousComments }
      },
      onError: (error, vars, context) => {
        if (context?.previousComments) {
          queryClient.setQueryData(
            commentsInfiniteQueryOptions(vars.workspaceId, vars.pageId)
              .queryKey,
            context.previousComments,
          )
        }
        toast.error(error?.message ?? m.toast_comment_resolve_failed())
      },
      onSuccess: () => {
        toast.success(m.toast_comment_resolved())
      },
    }),
  )
}
