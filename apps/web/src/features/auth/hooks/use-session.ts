import { useSuspenseQuery } from '@tanstack/react-query'
import { useBetterAuth } from './use-better-auth'
import { authQueryOptions } from '../query-options'

export const useSession = () => {
  const authClient = useBetterAuth()

  return useSuspenseQuery(authQueryOptions(authClient))
}
