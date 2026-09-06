import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental'

export function getQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        staleTime: 1000 * 60 * 15,
        gcTime: 1000 * 60 * 15,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  })

  if (typeof window !== 'undefined') {
    broadcastQueryClient({
      queryClient,
      broadcastChannel: 'dotion-app',
    })
  }

  return queryClient
}

export function TanstackQueryProvider({
  children,
  queryClient,
}: {
  children: React.ReactNode
  queryClient: QueryClient
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
