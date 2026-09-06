import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
import type { RestoreFromTrashInput } from '../types'

export function useRestoreFromTrash() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: RestoreFromTrashInput) =>
        pagesApi.restoreFromTrash(input),
      onSuccess: (_page, variables) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.tree(variables.workspaceId),
        })
        queryClient.invalidateQueries({
          queryKey: pagesKeys.trash(variables.workspaceId),
        })
      },
    }),
  )
}
