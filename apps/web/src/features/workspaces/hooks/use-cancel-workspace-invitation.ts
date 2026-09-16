import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { m } from '@/paraglide/messages'

import type { WorkspaceId, WorkspaceInvitationId } from '../types'

export interface CancelWorkspaceInvitationInput {
  workspaceId: WorkspaceId
  invitationId: WorkspaceInvitationId
}

export function useCancelWorkspaceInvitation() {
  return useMutation(
    resultMutationOptions({
      mutationFn: ({
        workspaceId,
        invitationId,
      }: CancelWorkspaceInvitationInput) =>
        workspacesApi.cancelWorkspaceInvitation(workspaceId, invitationId),
      onSuccess: () => {},
      onError: (error) => {
        toast.error(
          error?.message ?? m.toast_workspace_invitation_cancel_failed(),
        )
      },
    }),
  )
}
