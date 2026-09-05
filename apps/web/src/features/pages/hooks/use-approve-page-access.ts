import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
import { updatePageAccessRequestStatusInCache } from '../utils'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { PageId } from '@dotion/shared/pages/types'
import type { WorkspaceId } from '@/features/workspaces/types'

export function useApprovePageAccess() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: ({
        workspaceId,
        pageId,
        requestId,
      }: {
        workspaceId: WorkspaceId
        pageId: PageId
        requestId: string
      }) => pagesApi.approveAccessRequest(workspaceId, pageId, requestId),
      onSuccess: (_data, vars) => {
        updatePageAccessRequestStatusInCache(
          queryClient,
          vars.workspaceId,
          vars.pageId,
          { hasPendingRequest: false, request: null },
        )
        queryClient.invalidateQueries({
          queryKey: pagesKeys.permissions(vars.workspaceId, vars.pageId),
        })
        toast.success(m.toast_access_request_approved())
      },
      onError: (error) => {
        console.error('Error approving page access:', error)
        toast.error(m.toast_access_request_approve_failed())
      },
    }),
  )
}
