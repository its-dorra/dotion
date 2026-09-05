import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { pendingInvitationsInfiniteQueryOptions } from '../query-options'
import { useAcceptInvitation } from '../hooks/use-accept-invitation'
import { useDeclineInvitation } from '../hooks/use-decline-invitation'
import { InvitationsListPresenter } from './invitations-list-presenter'
import { InvitationsLoading } from './invitations-loading'
import { InvitationsError } from './invitations-error'
import { InvitationsEmpty } from './invitations-empty'

export function InvitationsContainer() {
  const query = useInfiniteQuery(pendingInvitationsInfiniteQueryOptions())
  const acceptInvitation = useAcceptInvitation()
  const declineInvitation = useDeclineInvitation()
  const [respondingId, setRespondingId] = useState<string | undefined>()

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

  async function handleAccept(invitationId: string) {
    setRespondingId(invitationId)
    try {
      await acceptInvitation.mutateAsync({ invitationId })
    } catch {
      // handled by mutation hook
    } finally {
      setRespondingId(undefined)
    }
  }

  async function handleDecline(invitationId: string) {
    setRespondingId(invitationId)
    try {
      await declineInvitation.mutateAsync({ invitationId })
    } catch {
      // handled by mutation hook
    } finally {
      setRespondingId(undefined)
    }
  }

  return (
    <InvitationsListPresenter
      invitations={invitations}
      onAccept={handleAccept}
      onDecline={handleDecline}
      respondingInvitationId={respondingId}
      hasNextPage={query.hasNextPage}
      fetchNextPage={query.fetchNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
    />
  )
}
