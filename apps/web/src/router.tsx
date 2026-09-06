import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as Sentry from '@sentry/tanstackstart-react'
import { routeTree } from './routeTree.gen'
import { TanstackQueryProvider } from './integrations/tanstack-query/root-provider'
import { getRouterContext } from './integrations/router-context'
import { deLocalizeUrl, localizeUrl } from './paraglide/runtime.js'
import { RouteErrorFallback } from '@/components/common/route-error'
import { NotFound } from '@/components/common/not-found'

export const getRouter = () => {
  const routerContext = getRouterContext()

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: {
      ...routerContext,
    },
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },
    defaultErrorComponent: RouteErrorFallback,
    defaultNotFoundComponent: () => <NotFound />,
    Wrap: (props: { children: React.ReactNode }) => (
      <TanstackQueryProvider queryClient={routerContext.queryClient}>
        {props.children}
      </TanstackQueryProvider>
    ),
  })

  if (!router.isServer) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      dataCollection: {
        userInfo: false,
        httpBodies: [],
      },
      integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
      enableLogs: true,
      tracesSampleRate: 1.0,
    })
  }

  setupRouterSsrQueryIntegration({
    router,
    queryClient: routerContext.queryClient,
    wrapQueryClient: false,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
