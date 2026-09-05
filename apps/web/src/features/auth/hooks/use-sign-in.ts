import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useBetterAuth } from './use-better-auth'
import type { AuthClient } from '../types'
import { authQueryKeys } from '../query-options'
import { useNavigate } from '@tanstack/react-router'

type SignInVariables =
  | {
      method: 'email'
      data: Omit<Parameters<AuthClient['signIn']['email']>[0], 'callbackURL'>
    }
  | {
      method: 'social'
      data: Omit<Parameters<AuthClient['signIn']['social']>[0], 'callbackURL'>
    }

export const useSignIn = () => {
  const { signIn } = useBetterAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const signInMutation = useMutation({
    mutationFn: async (vars: SignInVariables) => {
      switch (vars.method) {
        case 'email': {
          const { data, error } = await signIn.email(
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
        }
        case 'social': {
          const { data, error } = await signIn.social(
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
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authQueryKeys.session })
      navigate({ to: '/app' })
    },
  })

  return signInMutation
}
