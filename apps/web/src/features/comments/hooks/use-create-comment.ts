import { useMutation } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { commentsApi } from '../api'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { CreateCommentInput } from '../types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

export interface CreateCommentVariables extends CreateCommentInput {
  workspaceId: WorkspaceId
}

export function useCreateComment() {
  return useMutation(
    resultMutationOptions({
      mutationFn: (input: CreateCommentVariables) =>
        commentsApi.createComment(input.workspaceId, input),

      onSuccess: () => {},
      onError: (error, variables) => {
        toast.error(
          error?.message ??
            (variables.parentId
              ? m.toast_comment_reply_failed()
              : m.toast_comment_add_failed()),
        )
      },
    }),
  )
}
