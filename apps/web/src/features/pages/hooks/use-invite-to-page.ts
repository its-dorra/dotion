import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
import { authorizationKeys } from '@/features/authorization/query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { InviteToPageInput } from '../types'

export function useInviteToPage() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: InviteToPageInput) => pagesApi.inviteToPage(input),
      onSuccess: (_permission, variables) => {
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
        toast.success(m.toast_page_invite_success({ email: variables.email }))
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_page_invite_failed())
      },
    }),
  )
}
