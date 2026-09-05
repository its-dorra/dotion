import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { aiAssistantApi } from '../api'
import { assistantKeys } from '../query-options'
import { toast } from 'sonner'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId } from '@dotion/shared/ids'

export function useDeleteAssistantThread(workspaceId: WorkspaceId) {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (threadId: AssistantThreadId) =>
        aiAssistantApi.deleteThread(workspaceId, threadId),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: assistantKeys.threads(workspaceId),
        })
      },
      onError: (error) => {
        console.error('Error deleting assistant thread:', error)
        toast.error('Failed to delete conversation.')
      },
    }),
  )
}
