import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { notificationsApi } from '../api'
import { m } from '@/paraglide/messages'

export function useMarkAllAsRead() {
  return useMutation(
    resultMutationOptions({
      mutationFn: () => notificationsApi.markAllAsRead(),
      onSuccess: () => {
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
