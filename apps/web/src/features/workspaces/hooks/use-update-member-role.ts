import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { updateWorkspaceMemberRoleInCache } from '../utils'
import type { UpdateMemberRoleInput } from '../types'
import * as m from '@/paraglide/messages'

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: UpdateMemberRoleInput) =>
        workspacesApi.updateMemberRole(input),
      onSuccess: (_member, variables) => {
        updateWorkspaceMemberRoleInCache(
          queryClient,
          variables.workspaceId,
          variables.memberId,
          variables.role,
        )
        toast.success(m.toast_workspace_member_role_updated())
      },
      onError: (error) => {
        toast.error(
          error?.message ?? m.toast_workspace_member_role_update_failed(),
        )
      },
    }),
  )
}
