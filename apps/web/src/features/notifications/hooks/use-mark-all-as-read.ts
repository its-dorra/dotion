import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { notificationsApi } from '../api'
import { markAllNotificationsAsReadInCache } from '../utils'
import * as m from '@/paraglide/messages'

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation(
    resultMutationOptions({
      mutationFn: () => notificationsApi.markAllAsRead(),
      onSuccess: () => {
        markAllNotificationsAsReadInCache(queryClient)
        toast.success(m.toast_notification_mark_all_read())
      },
      onError: (error) => {
        toast.error(
          error?.message ?? m.toast_notification_mark_all_read_failed(),
        )
      },
    }),
  )
}
