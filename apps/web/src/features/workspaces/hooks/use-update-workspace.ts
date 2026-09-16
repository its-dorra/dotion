import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import {
  workspacesListQueryOptions,
  workspaceDetailQueryOptions,
} from '../query-options'
import type { UpdateWorkspaceInput } from '../types'
import { m } from '@/paraglide/messages'

export function useUpdateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: UpdateWorkspaceInput) =>
        workspacesApi.updateWorkspace(input),
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: workspacesListQueryOptions().queryKey,
        })
        await queryClient.cancelQueries({
          queryKey: workspaceDetailQueryOptions(variables.workspaceId).queryKey,
        })

        const previousList = queryClient.getQueryData(
          workspacesListQueryOptions().queryKey,
        )
        const previousDetail = queryClient.getQueryData(
          workspaceDetailQueryOptions(variables.workspaceId).queryKey,
        )

        queryClient.setQueryData(
          workspaceDetailQueryOptions(variables.workspaceId).queryKey,
          (old) => (old ? { ...old, ...variables } : old),
        )
        queryClient.setQueryData(workspacesListQueryOptions().queryKey, (old) =>
          old?.map((w) =>
            w.id === variables.workspaceId ? { ...w, ...variables } : w,
          ),
        )

        return { previousList, previousDetail }
      },
      onError: (error, variables, context) => {
        if (context?.previousList) {
          queryClient.setQueryData(
            workspacesListQueryOptions().queryKey,
            context.previousList,
          )
        }
        if (context?.previousDetail) {
          queryClient.setQueryData(
            workspaceDetailQueryOptions(variables.workspaceId).queryKey,
            context.previousDetail,
          )
        }
        toast.error(error?.message ?? m.toast_workspace_update_failed())
      },
      onSuccess: (workspace) => {
        queryClient.setQueryData(
          workspaceDetailQueryOptions(workspace.id).queryKey,
          workspace,
        )
        queryClient.setQueryData(workspacesListQueryOptions().queryKey, (old) =>
          old?.map((w) => (w.id === workspace.id ? { ...w, ...workspace } : w)),
        )
        toast.success(m.toast_workspace_updated())
      },
    }),
  )
}
