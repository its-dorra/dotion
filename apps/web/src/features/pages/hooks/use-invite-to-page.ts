import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { addPageMemberPermissionToCache } from '../utils'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'
import type { InviteToPageInput } from '../types'

export function useInviteToPage() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: InviteToPageInput) => pagesApi.inviteToPage(input),
      onSuccess: (permission, variables) => {
        addPageMemberPermissionToCache(
          queryClient,
          variables.workspaceId,
          variables.pageId,
          permission,
        )
        toast.success(m.toast_page_invite_success({ email: variables.email }))
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_page_invite_failed())
      },
    }),
  )
}
