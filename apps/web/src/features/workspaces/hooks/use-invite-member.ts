import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import type { InviteMemberInput } from '../types'
import * as m from '@/paraglide/messages'

export function useInviteMember() {
  return useMutation(
    resultMutationOptions({
      mutationFn: (input: InviteMemberInput) =>
        workspacesApi.inviteMember(input),
      onSuccess: () => {},
      onError: (error) => {
        toast.error(error?.message ?? m.toast_workspace_invite_failed())
      },
    }),
  )
}
