import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { removeWorkspaceInvitationFromCache } from '../utils'
import * as m from '@/paraglide/messages'

export interface CancelWorkspaceInvitationInput {
  workspaceId: string
  invitationId: string
}

export function useCancelWorkspaceInvitation() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: ({
        workspaceId,
        invitationId,
      }: CancelWorkspaceInvitationInput) =>
        workspacesApi.cancelWorkspaceInvitation(workspaceId, invitationId),
      onSuccess: (_data, variables) => {
        removeWorkspaceInvitationFromCache(
          queryClient,
          variables.workspaceId,
          variables.invitationId,
        )
      },
      onError: (error) => {
        toast.error(
          error?.message ?? m.toast_workspace_invitation_cancel_failed(),
        )
      },
    }),
  )
}
