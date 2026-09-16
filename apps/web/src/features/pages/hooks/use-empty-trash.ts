import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import {
  trashedPagesQueryOptions,
  pageDetailQueryOptions,
} from '../query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { EmptyTrashInput, PageId } from '../types'

export function useEmptyTrash() {
  const queryClient = useQueryClient()
  const params = useParams({ strict: false }) as {
    workspaceId?: string
    pageId?: PageId
  }
  const navigate = useNavigate()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: EmptyTrashInput) => pagesApi.emptyTrash(input),
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: trashedPagesQueryOptions(variables.workspaceId).queryKey,
        })
        const previousTrash = queryClient.getQueryData(
          trashedPagesQueryOptions(variables.workspaceId).queryKey,
        )
        queryClient.setQueryData(
          trashedPagesQueryOptions(variables.workspaceId).queryKey,
          [],
        )
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
        let isCurrentlyOnTrashedPage = false
        if (params.pageId) {
          const pageData = queryClient.getQueryData(
            pageDetailQueryOptions(variables.workspaceId, params.pageId)
              .queryKey,
          )
          const trashedPages = queryClient.getQueryData(
            trashedPagesQueryOptions(variables.workspaceId).queryKey,
          )
          if (
            pageData?.inTrash ||
            trashedPages?.some((p) => p.id === params.pageId)
          ) {
            isCurrentlyOnTrashedPage = true
          }
        }

        if (isCurrentlyOnTrashedPage && params.pageId) {
          queryClient.removeQueries({
            queryKey: pageDetailQueryOptions(
              variables.workspaceId,
              params.pageId,
            ).queryKey,
          })
          navigate({
            to: '/app/workspaces/$workspaceId/trash',
            params: { workspaceId: variables.workspaceId },
          })
        }
        toast(m.toast_trash_emptied())
      },
    }),
  )
}
