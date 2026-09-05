import { queryOptions } from '@tanstack/react-query'
import type { AuthClient } from './types'
import * as Sentry from '@sentry/tanstackstart-react'

export const authQueryKeys = {
  session: ['session'] as const,
}

export const authQueryOptions = (authClient: AuthClient) =>
  queryOptions({
    queryKey: authQueryKeys.session,
    retry: false,
    queryFn: async () => {
      const { data, error } = await authClient.getSession({
        fetchOptions: { throw: false },
      })

      if (error) {
        Sentry.captureException(error, {
          extra: {
            name: 'Error fetching session',
            context: {
              error,
            },
          },
        })
        return {
          user: null,
          session: null,
        }
      }
      return data
    },
  })
