import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { pagesApi } from '../api'
import { pagesKeys } from '../query-options'
import type { DeletePermanentlyInput } from '../types'

export function useDeletePermanently() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: DeletePermanentlyInput) =>
        pagesApi.deletePermanently(input),
      onSuccess: (_result, variables) => {
        queryClient.invalidateQueries({
          queryKey: pagesKeys.trash(variables.workspaceId),
        })
      },
    }),
  )
}
