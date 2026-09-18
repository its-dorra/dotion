import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import {
  workspacesListQueryOptions,
  workspaceDetailQueryOptions,
} from '../query-options'
import { removeNotificationByInvitationIdFromCache } from '@/features/notifications/utils'
import { m } from '@/paraglide/messages'

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: workspacesApi.acceptInvitation,
      onSuccess: (workspace, variables) => {
        removeNotificationByInvitationIdFromCache({
          queryClient,
          invitationId: variables.invitationId,
        })
        queryClient.setQueryData(
          workspacesListQueryOptions().queryKey,
          (old) => (old ? [...old, workspace] : [workspace]),
        )
        queryClient.setQueryData(
          workspaceDetailQueryOptions(workspace.id).queryKey,
          workspace,
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
