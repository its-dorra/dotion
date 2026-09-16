import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { aiAssistantApi } from '../api'
import { assistantThreadsInfiniteQueryOptions } from '../query-options'
import { removeThreadFromCache } from '../utils'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId } from '@dotion/shared/ids'

export function useDeleteAssistantThread(workspaceId: WorkspaceId) {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: (threadId: AssistantThreadId) =>
        aiAssistantApi.deleteThread(workspaceId, threadId),
      onMutate: async (threadId) => {
        await queryClient.cancelQueries({
          queryKey: assistantThreadsInfiniteQueryOptions(workspaceId).queryKey,
        })
        const previousThreads = queryClient.getQueryData(
          assistantThreadsInfiniteQueryOptions(workspaceId).queryKey,
        )

        removeThreadFromCache({ queryClient, workspaceId, threadId })

        return { previousThreads }
      },
      onError: (error, _threadId, context) => {
        if (context?.previousThreads) {
          queryClient.setQueryData(
            assistantThreadsInfiniteQueryOptions(workspaceId).queryKey,
            context.previousThreads,
          )
        }
        console.error('Error deleting assistant thread:', error)
        toast.error(error?.message ?? m.error_assistant_threads_failed())
      },
    }),
  )
}
