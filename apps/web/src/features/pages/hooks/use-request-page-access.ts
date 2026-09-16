import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { updatePageAccessRequestStatusInCache } from '../utils'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { PageId, PagePermissionRole } from '@dotion/shared/pages/types'
import type { WorkspaceId } from '@/features/workspaces/types'

export function useRequestPageAccess() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: ({
        workspaceId,
        pageId,
        requestedRole = 'editor',
      }: {
        workspaceId: WorkspaceId
        pageId: PageId
        requestedRole?: PagePermissionRole
      }) => pagesApi.createAccessRequest(workspaceId, pageId, requestedRole),
      onSuccess: (data, vars) => {
        updatePageAccessRequestStatusInCache(
          queryClient,
          vars.workspaceId,
          vars.pageId,
          { hasPendingRequest: true, request: data },
        )
        toast.success(m.page_request_access_success())
      },
      onError: (error) => {
        console.error('Error requesting page access:', error)
        toast.error(m.page_request_access_failed())
      },
    }),
  )
}
