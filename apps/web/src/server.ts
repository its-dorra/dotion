import handler from '@tanstack/react-start/server-entry'
import { paraglideMiddleware } from '@/paraglide/server'
import * as Sentry from '@sentry/cloudflare'
import { wrapFetchWithSentry } from '@sentry/tanstackstart-react'

export default Sentry.withSentry(
  () => ({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    dataCollection: {
      userInfo: false,
      httpBodies: [],
    },
    enableLogs: true,
    tracesSampleRate: 1.0,
  }),
  wrapFetchWithSentry({
    // @ts-expect-error
    fetch: (request: Request, env: Env) => {
      const url = new URL(request.url)
      if (url.pathname.startsWith('/api')) {
        return env.BACKEND.fetch(request)
      }
      return paraglideMiddleware(request, () => {
        return handler.fetch(request)
      })
    },
  }),
)
