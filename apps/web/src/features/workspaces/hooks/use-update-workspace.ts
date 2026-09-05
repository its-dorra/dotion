import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { workspacesKeys } from '../query-options'
import type { UpdateWorkspaceInput } from '../types'
import * as m from '@/paraglide/messages'

export function useUpdateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: UpdateWorkspaceInput) =>
        workspacesApi.updateWorkspace(input),
      onSuccess: (workspace) => {
        queryClient.invalidateQueries({ queryKey: workspacesKeys.list() })
        queryClient.invalidateQueries({
          queryKey: workspacesKeys.detail(workspace.id),
        })
        toast.success(m.toast_workspace_updated())
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_workspace_update_failed())
      },
    }),
  )
}
