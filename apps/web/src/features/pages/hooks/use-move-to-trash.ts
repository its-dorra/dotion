import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from '@tanstack/react-router'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import {
  pageTreeQueryOptions,
  trashedPagesQueryOptions,
  pageDetailQueryOptions,
} from '../query-options'
import { removePageAndDescendantsFromTree, addPageToTrash } from '../utils'
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

        queryClient.setQueryData(
          pageTreeQueryOptions(variables.workspaceId).queryKey,
          (oldTree) =>
            removePageAndDescendantsFromTree(oldTree, variables.pageId),
        )

        queryClient.setQueryData(
          trashedPagesQueryOptions(variables.workspaceId).queryKey,
          (oldTrash) =>
            addPageToTrash(oldTrash, {
              id: variables.pageId,
              parentId: previousDetail?.parentId ?? null,
              title: previousDetail?.title ?? 'Untitled',
              icon: previousDetail?.icon ?? undefined,
              deletedAt: new Date().toISOString(),
              deletedByName: 'A member',
            }),
        )

        queryClient.setQueryData(
          pageDetailQueryOptions(variables.workspaceId, variables.pageId)
            .queryKey,
          (old) => (old ? { ...old, inTrash: true } : old),
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
        toast.error(error?.message ?? m.toast_page_delete_failed())
      },
      onSuccess: (_result, variables) => {
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
