import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { workspacesKeys } from '../query-options'
import { removeWorkspaceInvitationFromCache } from '../utils'
import { notificationsKeys } from '@/features/notifications/query-options'
import type { AcceptInvitationInput } from '../types'
import * as m from '@/paraglide/messages'

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: AcceptInvitationInput) =>
        workspacesApi.acceptInvitation(input),
      onSuccess: (workspace, variables) => {
        removeWorkspaceInvitationFromCache(
          queryClient,
          workspace.id,
          variables.invitationId,
        )
        queryClient.invalidateQueries({ queryKey: workspacesKeys.list() })
        queryClient.invalidateQueries({
          queryKey: notificationsKeys.all,
        })
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
