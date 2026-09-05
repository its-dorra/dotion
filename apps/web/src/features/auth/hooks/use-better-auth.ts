import { useRouteContext } from '@tanstack/react-router'

export const useBetterAuth = () => {
  const betterAuth = useRouteContext({
    from: '__root__',
    select: (s) => s.authClient,
  })

  return betterAuth
}
