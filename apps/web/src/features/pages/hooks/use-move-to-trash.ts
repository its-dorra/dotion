import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { MoveToTrashInput } from '../types'

export function useMoveToTrash() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { pageId?: string }

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: MoveToTrashInput) => pagesApi.moveToTrash(input),
      onSuccess: (_result, variables) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.tree(variables.workspaceId),
        })
        queryClient.invalidateQueries({
          queryKey: pagesKeys.trash(variables.workspaceId),
        })
        queryClient.invalidateQueries({
          queryKey: pagesKeys.detail(variables.pageId),
        })
        if (params.pageId === variables.pageId) {
          navigate({
            to: '/app/workspaces/$workspaceId',
            params: { workspaceId: variables.workspaceId },
          })
          toast.info(m.toast_page_moved_to_trash())
        }
      },
    }),
  )
}
