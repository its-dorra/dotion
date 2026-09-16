import { queryOptions } from '@tanstack/react-query'
import type { AuthClient } from './types'

export const authQueryKeys = {
  session: ['session'] as const,
}

export const authQueryOptions = (authClient?: AuthClient) =>
  queryOptions({
    queryKey: authQueryKeys.session,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      if (!authClient) throw new Error('Auth client required for queryFn')
      const { data, error } = await authClient.getSession({
        fetchOptions: { throw: false },
      })

      if (error) {
        return {
          user: null,
          session: null,
        }
      }
      return data
    },
  })
