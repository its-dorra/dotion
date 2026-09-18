import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { m } from '@/paraglide/messages'

export function useUpdateMemberRole() {
  return useMutation(
    resultMutationOptions({
      mutationFn: workspacesApi.updateMemberRole,
      onSuccess: () => {
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
