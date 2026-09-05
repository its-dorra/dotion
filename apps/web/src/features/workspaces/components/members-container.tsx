import { useInfiniteQuery } from '@tanstack/react-query'
import {
  workspaceMembersInfiniteQueryOptions,
  workspaceInvitationsInfiniteQueryOptions,
} from '../query-options'
import { MembersPresenter } from './members-presenter'
import { MembersLoading } from './members-loading'
import { MembersError } from './members-error'
import type { WorkspaceRole } from '../types'

interface MembersContainerProps {
  workspaceId: string
  canManage: boolean
  currentUserRole: WorkspaceRole
}

export function MembersContainer({
  workspaceId,
  canManage,
  currentUserRole: _currentUserRole,
}: MembersContainerProps) {
  const membersQuery = useInfiniteQuery(
    workspaceMembersInfiniteQueryOptions(workspaceId),
  )

  const invitationsQuery = useInfiniteQuery({
    ...workspaceInvitationsInfiniteQueryOptions(workspaceId),
    enabled: Boolean(workspaceId) && canManage,
  })

  if (membersQuery.isPending) {
    return <MembersLoading />
  }

  if (membersQuery.isError) {
    return (
      <MembersError
        message={membersQuery.error.message}
        onRetry={() => membersQuery.refetch()}
      />
    )
  }

  const members = membersQuery.data?.pages.flatMap((page) => page.payload) ?? []
  const pendingInvitations =
    invitationsQuery.data?.pages.flatMap((page) => page.payload) ?? []

  return (
    <MembersPresenter
      workspaceId={workspaceId}
      members={members}
      pendingInvitations={pendingInvitations}
      canManage={canManage}
      hasNextPage={membersQuery.hasNextPage}
      fetchNextPage={membersQuery.fetchNextPage}
      isFetchingNextPage={membersQuery.isFetchingNextPage}
    />
  )
}
