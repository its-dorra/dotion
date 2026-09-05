import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { hc } from 'hono/client'
import type { ApiApp } from '@dotion/server'
import { env } from 'cloudflare:workers'

export const getApiClient = createIsomorphicFn()
  .server(() => {
    const request = getRequest()
    const url = new URL(request.url)
    return hc<ApiApp>(url.origin, {
      init: {
        credentials: 'include',
        headers: request.headers,
      },
      fetch(input, requestInit, _Env) {
        const req =
          input instanceof Request ? input : new Request(input, requestInit)
        return env.BACKEND.fetch(req)
      },
    })
  })
  .client(() => {
    return hc<ApiApp>('/', {
      init: {
        credentials: 'include',
      },
    })
  })

export type ApiClient = ReturnType<typeof getApiClient>
