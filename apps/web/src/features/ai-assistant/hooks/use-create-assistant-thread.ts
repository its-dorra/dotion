import { useMutation, useQueryClient } from '@tanstack/react-query'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { aiAssistantApi } from '../api'
import { addThreadToCache } from '../utils'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

export function useCreateAssistantThread(workspaceId: WorkspaceId) {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: () => aiAssistantApi.createThread(workspaceId),
      onSuccess: (thread) => {
        addThreadToCache({ queryClient, workspaceId, thread })
      },
      onError: (error) => {
        console.error('Error creating assistant thread:', error)
        toast.error(error?.message ?? m.error_assistant_threads_failed())
      },
    }),
  )
}
