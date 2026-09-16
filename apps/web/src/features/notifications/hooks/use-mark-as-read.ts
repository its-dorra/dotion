import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { resultMutationOptions } from '@/integrations/tanstack-query/better-result/mutation-options'
import { notificationsApi } from '../api'
import * as m from '@/paraglide/messages'

export function useMarkAsRead() {
  return useMutation(
    resultMutationOptions({
      mutationFn: (notificationId: string) =>
        notificationsApi.markAsRead(notificationId),
      onSuccess: () => {},
      onError: (error) => {
        toast.error(error?.message ?? m.toast_notification_mark_read_failed())
      },
    }),
  )
}
