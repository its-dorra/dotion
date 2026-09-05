import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
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
      onSuccess: (_data, vars) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.accessRequestStatus(
            vars.workspaceId,
            vars.pageId,
          ),
        })
        toast.success(m.page_request_access_success())
      },
      onError: (error) => {
        console.error('Error requesting page access:', error)
        toast.error(m.page_request_access_failed())
      },
    }),
  )
}
