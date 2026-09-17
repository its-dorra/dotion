import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { removeNotificationByInvitationIdFromCache } from '@/features/notifications/utils'
import type { DeclineInvitationInput } from '../types'
import { m } from '@/paraglide/messages'

export function useDeclineInvitation() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: DeclineInvitationInput) =>
        workspacesApi.declineInvitation(input),
      onSuccess: (_data, variables) => {
        removeNotificationByInvitationIdFromCache({
          queryClient,
          invitationId: variables.invitationId,
        })
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_workspace_decline_failed())
      },
    }),
  )
}
