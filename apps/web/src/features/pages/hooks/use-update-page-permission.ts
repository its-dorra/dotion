import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagePermissionsInfiniteQueryOptions } from '../query-options'
import { updatePagePermissionInCache } from '../utils'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'
import type { UpdatePagePermissionInput } from '../types'

export function useUpdatePagePermission() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: UpdatePagePermissionInput) =>
        pagesApi.updatePagePermission(input),
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: pagePermissionsInfiniteQueryOptions(
            variables.workspaceId,
            variables.pageId,
          ).queryKey,
        })
        const previousPermissions = queryClient.getQueryData(
          pagePermissionsInfiniteQueryOptions(
            variables.workspaceId,
            variables.pageId,
          ).queryKey,
        )
        updatePagePermissionInCache(
          queryClient,
          variables.workspaceId,
          variables.pageId,
          variables.userId,
          variables.role,
        )
        return { previousPermissions }
      },
      onError: (error, variables, context) => {
        if (context?.previousPermissions) {
          queryClient.setQueryData(
            pagePermissionsInfiniteQueryOptions(
              variables.workspaceId,
              variables.pageId,
            ).queryKey,
            context.previousPermissions,
          )
        }
        console.error('Error updating page permission:', error)
        toast.error(m.toast_permission_update_failed())
      },
      onSuccess: () => {
        toast.success(m.toast_permission_updated())
      },
    }),
  )
}
