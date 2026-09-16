import { useState } from 'react'
import { UserPlus, Users, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MemberRow } from './member-row'
import { PendingInvitationRow } from './pending-invitation-row'
import { MembersEmpty } from './members-empty'
import { InviteMemberModal } from './invite-member-modal'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import { m } from '@/paraglide/messages'
import type {
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceId,
} from '../types'

interface MembersPresenterProps {
  workspaceId: WorkspaceId
  members: WorkspaceMember[]
  pendingInvitations: WorkspaceInvitation[]
  canManage: boolean
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
}

export function MembersPresenter({
  workspaceId,
  members,
  pendingInvitations,
  canManage,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: MembersPresenterProps) {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const otherMembers = members.filter((m) => m.role !== 'owner')
  const owner = members.find((m) => m.role === 'owner')
  const totalCount = members.length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{m.members_title()}</h2>
            <Badge variant="secondary" className="text-xs font-normal">
              {totalCount === 1
                ? m.members_count_one({ count: totalCount })
                : m.members_count_other({ count: totalCount })}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {m.members_description()}
          </p>
        </div>

        {canManage ? (
          <Button
            onClick={() => setIsInviteDialogOpen(true)}
            size="sm"
            className="gap-1.5 shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            {m.workspace_invite_member()}
          </Button>
        ) : null}
      </div>

      {canManage ? (
        <InviteMemberModal
          workspaceId={workspaceId}
          open={isInviteDialogOpen}
          onOpenChange={setIsInviteDialogOpen}
        />
      ) : null}

      {pendingInvitations.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {m.members_pending_invitations({
                count: pendingInvitations.length,
              })}
            </h3>
          </div>
          <div className="divide-y rounded-lg border bg-card px-3">
            {pendingInvitations.map((invitation) => (
              <PendingInvitationRow
                key={invitation.id}
                invitation={invitation}
                canManage={canManage}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {m.workspace_members()}
          </h3>
        </div>

        <div className="divide-y rounded-lg border bg-card px-3">
          {owner ? (
            <MemberRow
              workspaceId={workspaceId}
              member={owner}
              canManage={canManage}
            />
          ) : null}
          {otherMembers.map((member) => (
            <MemberRow
              key={member.id}
              workspaceId={workspaceId}
              member={member}
              canManage={canManage}
            />
          ))}
        </div>
      </div>

      <InfiniteScroll
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        loadingText={m.members_loading_more()}
        loadMoreText={m.members_load_more()}
      />

      {otherMembers.length === 0 && !owner ? <MembersEmpty /> : null}
    </div>
  )
}
