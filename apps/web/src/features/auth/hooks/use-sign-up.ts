import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBetterAuth } from './use-better-auth'
import type { AuthClient } from '../types'
import { useNavigate } from '@tanstack/react-router'
import { authQueryKeys } from '../query-options'

type SignUpVariables = {
  method: 'email'
  data: Omit<Parameters<AuthClient['signUp']['email']>[0], 'callbackURL'>
}

export const useSignUp = () => {
  const { signUp } = useBetterAuth()
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.session })
      navigate({ to: '/app' })
    },
  })

  return signUpMutation
}
