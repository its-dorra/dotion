import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { SetPagePublicInput } from '../types'

export function useSetPagePublic() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: SetPagePublicInput) => pagesApi.setPagePublic(input),
      onSuccess: (page, variables) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.detail(page.id),
        })
        toast(
          variables.isPublic ? m.toast_page_public() : m.toast_page_private(),
        )
      },
      onError: (error) => {
        toast.error(
          error?.message ?? m.toast_page_public_access_update_failed(),
        )
      },
    }),
  )
}
