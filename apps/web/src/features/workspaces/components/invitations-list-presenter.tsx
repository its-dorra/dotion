import { InvitationCard } from './invitation-card'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import * as m from '@/paraglide/messages'
import type { WorkspaceInvitation } from '../types'

interface InvitationsListPresenterProps {
  invitations: WorkspaceInvitation[]
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
}

export function InvitationsListPresenter({
  invitations,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: InvitationsListPresenterProps) {
  return (
    <div className="space-y-2">
      {invitations.map((invitation) => (
        <InvitationCard key={invitation.id} invitation={invitation} />
      ))}

      <InfiniteScroll
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        loadingText={m.workspace_invitations_loading_more()}
        loadMoreText={m.workspace_invitations_load_more()}
      />
    </div>
  )
}
