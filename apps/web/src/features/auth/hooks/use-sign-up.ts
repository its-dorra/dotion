import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBetterAuth } from './use-better-auth'
import type { AuthClient } from '../types'
import { useNavigate } from '@tanstack/react-router'
import { authQueryOptions } from '../query-options'

type SignUpVariables = {
  method: 'email'
  data: Omit<Parameters<AuthClient['signUp']['email']>[0], 'callbackURL'>
}

export const useSignUp = () => {
  const authClient = useBetterAuth()
  const { signUp } = authClient
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const signUpMutation = useMutation({
    mutationFn: async (vars: SignUpVariables) => {
      const { data, error } = await signUp.email(
        {
          ...vars.data,
          callbackURL: `${window.location.origin}/app`,
        },
        {
          throw: false,
        },
      )
      if (error) {
        throw new Error(error.message)
      }
      return data
    },
    onSuccess: async () => {
      const session = await authClient.getSession({
        fetchOptions: { throw: false },
      })
      if (session.data) {
        queryClient.setQueryData(authQueryOptions().queryKey, session.data)
      }
      navigate({ to: '/app' })
    },
  })

  return signUpMutation
}
