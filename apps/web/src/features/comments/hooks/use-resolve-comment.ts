import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { commentsApi } from '../api'
import type { ResolveCommentInput } from '../types'
import { commentsKeys } from '../query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'

export type ResolveCommentVariables = ResolveCommentInput

export function useResolveComment() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: ResolveCommentVariables) =>
        commentsApi.resolveComment(input.workspaceId, input),

      onSuccess: (_data, vars) => {
        queryClient.invalidateQueries({
          queryKey: commentsKeys.list(vars.workspaceId, vars.pageId),
        })
        toast.success(m.toast_comment_resolved())
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_comment_resolve_failed())
      },
    }),
  )
}
