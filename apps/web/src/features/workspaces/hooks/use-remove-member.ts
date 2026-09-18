import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { m } from '@/paraglide/messages'

export function useRemoveMember() {
  return useMutation(
    resultMutationOptions({
      mutationFn: workspacesApi.removeMember,
      onSuccess: () => {},
      onError: (error) => {
        toast.error(error?.message ?? m.toast_workspace_member_remove_failed())
      },
    }),
  )
}
