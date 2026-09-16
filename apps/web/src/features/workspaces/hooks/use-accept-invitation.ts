import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { workspacesListQueryOptions } from '../query-options'
import { removeNotificationByInvitationIdFromCache } from '@/features/notifications/utils'
import type { AcceptInvitationInput } from '../types'
import { m } from '@/paraglide/messages'

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: AcceptInvitationInput) =>
        workspacesApi.acceptInvitation(input),
      onSuccess: (workspace, variables) => {
        removeNotificationByInvitationIdFromCache(
          queryClient,
          variables.invitationId,
        )
        queryClient.setQueryData(
          workspacesListQueryOptions().queryKey,
          (old) => (old ? [...old, workspace] : [workspace]),
        )
        toast.success(
          m.toast_workspace_accept_invitation_joined({ name: workspace.name }),
        )
      },
      onError: (error) => {
        toast.error(
          error?.message ?? m.toast_workspace_accept_invitation_failed(),
        )
      },
    }),
  )
}
