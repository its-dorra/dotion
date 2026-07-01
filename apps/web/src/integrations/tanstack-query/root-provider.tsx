import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function getQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnMount: false,
        refetchOnWindowFocus: true,
        refetchInterval: 1000 * 60 * 3,
        refetchOnReconnect: "always",
        staleTime: 1000 * 60 * 3,
        gcTime: 1000 * 60 * 3,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  });
  return queryClient;
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
