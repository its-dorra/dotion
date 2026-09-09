import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { EmptyTrashInput, TrashedPage } from '../types'
import type { Page } from '@dotion/shared/pages/types'

export function useEmptyTrash() {
  const queryClient = useQueryClient()
  const params = useParams({ strict: false }) as {
    workspaceId?: string
    pageId?: string
  }
  const navigate = useNavigate()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: EmptyTrashInput) => pagesApi.emptyTrash(input),
      onSuccess: (_result, variables) => {
        let isCurrentlyOnTrashedPage = false
        if (params.pageId) {
          const pageData = queryClient.getQueryData<Page>(
            pagesKeys.detail(params.pageId),
          )
          const trashedPages = queryClient.getQueryData<TrashedPage[]>(
            pagesKeys.trash(variables.workspaceId),
          )
          if (
            pageData?.inTrash ||
            trashedPages?.some((p) => p.id === params.pageId)
          ) {
            isCurrentlyOnTrashedPage = true
          }
        }

        queryClient.setQueryData(pagesKeys.trash(variables.workspaceId), [])
        queryClient.invalidateQueries({
          queryKey: pagesKeys.trash(variables.workspaceId),
        })

        if (isCurrentlyOnTrashedPage && params.pageId) {
          queryClient.removeQueries({
            queryKey: pagesKeys.detail(params.pageId),
          })
          navigate({
            to: '/app/workspaces/$workspaceId/trash',
            params: { workspaceId: variables.workspaceId },
          })
        }
        toast(m.toast_trash_emptied())
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_page_delete_failed())
      },
    }),
  )
}
