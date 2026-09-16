import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBetterAuth } from './use-better-auth'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { m } from '@/paraglide/messages'
import { authQueryOptions } from '../query-options'

export const useSignOut = () => {
  const { signOut } = useBetterAuth()

  const queryClient = useQueryClient()

  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => signOut(),
    onSettled: () => {
      queryClient.setQueryData(authQueryOptions().queryKey, null)
      queryClient.clear()
      navigate({ to: '/' })
    },
    onError: (error) => {
      console.error('Error signing out:', error)
      toast.error(m.toast_auth_sign_out_failed())
    },
  })
}
