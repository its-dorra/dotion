import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { removeWorkspaceMemberFromCache } from '../utils'
import type { RemoveMemberInput } from '../types'
import * as m from '@/paraglide/messages'

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: RemoveMemberInput) =>
        workspacesApi.removeMember(input),
      onSuccess: (_result, variables) => {
        removeWorkspaceMemberFromCache(
          queryClient,
          variables.workspaceId,
          variables.memberId,
        )
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_workspace_member_remove_failed())
      },
    }),
  )
}
