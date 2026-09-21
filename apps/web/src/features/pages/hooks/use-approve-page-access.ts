import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { updatePageAccessRequestStatusInCache } from '../utils'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'
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
      onSuccess: (_permission, vars) => {
        updatePageAccessRequestStatusInCache({
          queryClient,
          workspaceId: vars.workspaceId,
          pageId: vars.pageId,
          status: { hasPendingRequest: false, request: null },
        })
        toast.success(m.toast_access_request_approved())
      },
      onError: () => {
        toast.error(m.toast_access_request_approve_failed())
      },
    }),
  )
}
