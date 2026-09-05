import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { notificationsKeys } from '@/features/notifications/query-options'
import type { DeclineInvitationInput } from '../types'
import * as m from '@/paraglide/messages'

export function useDeclineInvitation() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: DeclineInvitationInput) =>
        workspacesApi.declineInvitation(input),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: notificationsKeys.all,
        })
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_workspace_decline_failed())
      },
    }),
  )
}
