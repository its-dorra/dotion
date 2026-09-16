import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import type { RemoveMemberInput } from '../types'
import { m } from '@/paraglide/messages'

export function useRemoveMember() {
  return useMutation(
    resultMutationOptions({
      mutationFn: (input: RemoveMemberInput) =>
        workspacesApi.removeMember(input),
      onSuccess: () => {},
      onError: (error) => {
        toast.error(error?.message ?? m.toast_workspace_member_remove_failed())
      },
    }),
  )
}
