import { useQueryClient } from '@tanstack/react-query'
import { useMutation } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { workspacesApi } from '../api'
import { workspacesListQueryOptions } from '../query-options'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { m } from '@/paraglide/messages'

export function useCreateWorkspace() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: workspacesApi.createWorkspace,

      onSuccess: (workspace) => {
        queryClient.setQueryData(
          workspacesListQueryOptions().queryKey,
          (old) => (old ? [...old, workspace] : [workspace]),
        )
        toast.success(m.toast_workspace_created({ name: workspace.name }))
        navigate({
          to: '/app/workspaces/$workspaceId',
          params: {
            workspaceId: workspace.id as unknown as string,
          },
        })
      },
      onError: (error) => {
        console.log({ error })
        toast.error(error?.message ?? m.toast_workspace_create_failed())
      },
    }),
  )
}
