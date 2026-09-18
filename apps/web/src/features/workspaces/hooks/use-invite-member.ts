import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { m } from '@/paraglide/messages'

export function useInviteMember() {
  return useMutation(
    resultMutationOptions({
      mutationFn: workspacesApi.inviteMember,
      onSuccess: () => {},
      onError: (error) => {
        toast.error(error?.message ?? m.toast_workspace_invite_failed())
      },
    }),
  )
}
