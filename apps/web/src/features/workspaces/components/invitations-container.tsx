import { useInfiniteQuery } from '@tanstack/react-query'
import { pendingInvitationsInfiniteQueryOptions } from '../query-options'
import { InvitationsListPresenter } from './invitations-list-presenter'
import { InvitationsLoading } from './invitations-loading'
import { InvitationsError } from './invitations-error'
import { InvitationsEmpty } from './invitations-empty'

export function InvitationsContainer() {
  const query = useInfiniteQuery(pendingInvitationsInfiniteQueryOptions())

  if (query.isPending) {
    return <InvitationsLoading />
  }

  if (query.isError) {
    return (
      <InvitationsError
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    )
  }

  const invitations = query.data?.pages.flatMap((page) => page.payload) ?? []

  if (invitations.length === 0) {
    return <InvitationsEmpty />
  }

  return (
    <InvitationsListPresenter
      invitations={invitations}
      hasNextPage={query.hasNextPage}
      fetchNextPage={query.fetchNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
    />
  )
}
