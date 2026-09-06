import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
import { toast } from 'sonner'
import * as m from '@/paraglide/messages'
import type { RestoreFromTrashInput } from '../types'

export function useRestoreFromTrash() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: RestoreFromTrashInput) =>
        pagesApi.restoreFromTrash(input),
      onSuccess: (page, variables) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.tree(variables.workspaceId),
        })
        queryClient.invalidateQueries({
          queryKey: pagesKeys.trash(variables.workspaceId),
        })
        toast.success(
          m.toast_page_restored({ title: page.title || m.page_untitled() }),
        )
      },
      onError: (error) => {
        toast.error(error?.message ?? m.toast_page_restore_failed())
      },
    }),
  )
}
