import { createAuthClient } from 'better-auth/react'

import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { env } from 'cloudflare:workers'

export const getAuthClient = createIsomorphicFn()
  .server(() => {
    const request = getRequest()
    const url = new URL(request.url)

    return createAuthClient({
      baseURL: url.origin,
      fetchOptions: {
        headers: request.headers,
        customFetchImpl: (input: RequestInfo | URL, init?: RequestInit) => {
          const req =
            input instanceof Request ? input : new Request(input, init)
          return env.BACKEND.fetch(req)
        },
      },
    })
  })
  .client(() => {
    return createAuthClient({
      fetchOptions: {
        credentials: 'include',
      },
    })
  })
