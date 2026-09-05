import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { aiAssistantApi } from '../api'
import { assistantKeys } from '../query-options'
import { toast } from 'sonner'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { CreateThreadRequest } from '../types'

export function useCreateAssistantThread(workspaceId: WorkspaceId) {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (input: CreateThreadRequest = {}) =>
        aiAssistantApi.createThread(workspaceId, input),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: assistantKeys.threads(workspaceId),
        })
      },
      onError: (error) => {
        console.error('Error creating assistant thread:', error)
        toast.error('Failed to create new conversation.')
      },
    }),
  )
}
