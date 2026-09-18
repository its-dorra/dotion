import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import {
  pageTreeQueryOptions,
  trashedPagesQueryOptions,
  pageDetailQueryOptions,
} from '../query-options'
import { addOrUpdatePageInTree, removePageFromTrash } from '../utils'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'


export function useRestoreFromTrash() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: 
        pagesApi.restoreFromTrash,
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: pageTreeQueryOptions(variables.workspaceId).queryKey,
        })
        await queryClient.cancelQueries({
          queryKey: trashedPagesQueryOptions(variables.workspaceId).queryKey,
        })
        await queryClient.cancelQueries({
          queryKey: pageDetailQueryOptions(
            variables.workspaceId,
            variables.pageId,
          ).queryKey,
        })

        const previousTree = queryClient.getQueryData(
          pageTreeQueryOptions(variables.workspaceId).queryKey,
        )
        const previousTrash = queryClient.getQueryData(
          trashedPagesQueryOptions(variables.workspaceId).queryKey,
        )
        const previousDetail = queryClient.getQueryData(
          pageDetailQueryOptions(variables.workspaceId, variables.pageId)
            .queryKey,
        )

        const trashedItem = previousTrash?.find(
          (p) => p.id === variables.pageId,
        )

        queryClient.setQueryData(
          trashedPagesQueryOptions(variables.workspaceId).queryKey,
          (oldTrash) =>
            removePageFromTrash({ oldTrash, pageId: variables.pageId }),
        )

        if (trashedItem) {
          queryClient.setQueryData(
            pageTreeQueryOptions(variables.workspaceId).queryKey,
            (oldTree) =>
              addOrUpdatePageInTree({
                oldTree,
                node: {
                  id: trashedItem.id,
                  title: trashedItem.title,
                  icon: trashedItem.icon ?? null,
                  parentId: trashedItem.parentId,
                },
              }),
          )
        }

        queryClient.setQueryData(
          pageDetailQueryOptions(variables.workspaceId, variables.pageId)
            .queryKey,
          (old) => (old ? { ...old, inTrash: false } : old),
        )

        return { previousTree, previousTrash, previousDetail }
      },
      onError: (error, variables, context) => {
        if (context?.previousTree) {
          queryClient.setQueryData(
            pageTreeQueryOptions(variables.workspaceId).queryKey,
            context.previousTree,
          )
        }
        if (context?.previousTrash) {
          queryClient.setQueryData(
            trashedPagesQueryOptions(variables.workspaceId).queryKey,
            context.previousTrash,
          )
        }
        if (context?.previousDetail) {
          queryClient.setQueryData(
            pageDetailQueryOptions(variables.workspaceId, variables.pageId)
              .queryKey,
            context.previousDetail,
          )
        }
        toast.error(error?.message ?? m.toast_page_restore_failed())
      },
      onSuccess: (page) => {
        toast.success(
          m.toast_page_restored({ title: page.title || m.page_untitled() }),
        )
      },
    }),
  )
}
