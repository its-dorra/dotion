import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import type {
  ResourceType,
  ResourceAction,
} from '@dotion/shared/authorization/types'
import { canQueryOptions } from '../query-options'
import type { CanParams } from '../types'

export type CanProps<
  R extends ResourceType = ResourceType,
  A extends ResourceAction<R> = ResourceAction<R>,
> = CanParams<R, A> & {
  children?: ReactNode | ((isAllowed: boolean) => ReactNode)
  fallback?: ReactNode
}

export function Can<R extends ResourceType, A extends ResourceAction<R>>(
  props: CanProps<R, A>,
) {
  const { children, fallback = null, ...params } = props
  const { data } = useQuery(canQueryOptions(params as unknown as CanParams<R, A>))
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

export function useCan<R extends ResourceType, A extends ResourceAction<R>>(
  params: CanParams<R, A>,
) {
  const { data } = useQuery(canQueryOptions(params))
  return data?.allowed ?? false
}
