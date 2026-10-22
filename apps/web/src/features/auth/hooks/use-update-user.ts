import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useBetterAuth } from './use-better-auth'
import { authQueryKeys } from '../query-options'
import { m } from '@/paraglide/messages'

export function useUpdateUser() {
  const authClient = useBetterAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name }: { name: string }) => {
      return await authClient.updateUser({
        name,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authQueryKeys.session })
      toast.success(m.toast_profile_updated())
    },
  })
}

