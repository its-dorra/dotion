import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import {
  trashedPagesQueryOptions,
  pageDetailQueryOptions,
} from '../query-options'
import { removePageFromTrash } from '../utils'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'
import type { DeletePermanentlyInput } from '../types'

export function useDeletePermanently() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { pageId?: string }

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: DeletePermanentlyInput) =>
        pagesApi.deletePermanently(input),
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trashedPagesQueryOptions(variables.workspaceId).queryKey,
        })
        const previousTrash = queryClient.getQueryData(
          trashedPagesQueryOptions(variables.workspaceId).queryKey,
        )
        queryClient.setQueryData(
          trashedPagesQueryOptions(variables.workspaceId).queryKey,
          (oldTrash) =>
            removePageFromTrash({ oldTrash, pageId: variables.pageId }),
        )
        queryClient.removeQueries({
          queryKey: pageDetailQueryOptions(
            variables.workspaceId,
            variables.pageId,
          ).queryKey,
        })
        return { previousTrash }
      },
      onError: (error, variables, context) => {
        if (context?.previousTrash) {
          queryClient.setQueryData(
            trashedPagesQueryOptions(variables.workspaceId).queryKey,
            context.previousTrash,
          )
        }
        toast.error(error?.message ?? m.toast_page_delete_failed())
      },
      onSuccess: (_result, variables) => {
        toast(m.toast_page_deleted_permanently())
        if (params.pageId === variables.pageId) {
          navigate({
            to: '/app/workspaces/$workspaceId/trash',
            params: { workspaceId: variables.workspaceId },
          })
        }
      },
    }),
  )
}
