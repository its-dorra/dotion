import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { DeletePermanentlyInput } from '../types'

export function useDeletePermanently() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { pageId?: string }

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: DeletePermanentlyInput) =>
        pagesApi.deletePermanently(input),
      onSuccess: (_result, variables) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.trash(variables.workspaceId),
        })
        queryClient.removeQueries({
          queryKey: pagesKeys.detail(variables.pageId),
        })
        toast(m.toast_page_deleted_permanently())
        if (params.pageId === variables.pageId) {
          navigate({
            to: '/app/workspaces/$workspaceId/trash',
            params: { workspaceId: variables.workspaceId },
          })
        }
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_page_delete_failed())
      },
    }),
  )
}
