import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
import { updatePagePermissionInCache } from '../utils'
import { authorizationKeys } from '@/features/authorization/query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { UpdatePagePermissionInput } from '../types'

export function useUpdatePagePermission() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: UpdatePagePermissionInput) =>
        pagesApi.updatePagePermission(input),
      onSuccess: (_permission, variables) => {
        updatePagePermissionInCache(
          queryClient,
          variables.workspaceId,
          variables.pageId,
          variables.userId,
          variables.role,
        )
        queryClient.invalidateQueries({
          queryKey: pagesKeys.permissions(
            variables.workspaceId,
            variables.pageId,
          ),
        })
        queryClient.invalidateQueries({
          queryKey: pagesKeys.detail(variables.pageId),
        })
        queryClient.invalidateQueries({
          queryKey: authorizationKeys.all,
        })
        toast.success(m.toast_permission_updated())
      },
      onError: (error) => {
        console.error('Error updating page permission:', error)
        toast.error(m.toast_permission_update_failed())
      },
    }),
  )
}
