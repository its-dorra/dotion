import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Permission, CanParams } from '@dotion/shared/authorization/types'
import { canQueryOptions } from '../query-options'

export type CanProps<P extends Permission = Permission> = CanParams<P> & {
  children?: ReactNode | ((isAllowed: boolean) => ReactNode)
  fallback?: ReactNode
}

export function Can<P extends Permission>(props: CanProps<P>) {
  const { children, fallback = null, ...params } = props
  const { data } = useQuery(canQueryOptions(params as unknown as CanParams<P>))
  const isAllowed = data?.allowed ?? false

  if (!isAllowed) {
    if (typeof children === 'function') {
      return <>{children(false)}</>
    }
    return <>{fallback}</>
  }

  if (typeof children === 'function') {
    return <>{children(true)}</>
  }

  return <>{children}</>
}

export function useCan<P extends Permission>(params: CanParams<P>) {
  const { data } = useQuery(canQueryOptions(params))
  return data?.allowed ?? false
}
