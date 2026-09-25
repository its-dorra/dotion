import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { pagePermissionsInfiniteQueryOptions } from '../query-options'
import { canQueryOptions } from '@/features/authorization/query-options'
import { ShareDropdownPresenter } from './share-dropdown-presenter'
import { SharePermissionsLoading } from './share-permissions-loading'
import { SharePermissionsError } from './share-permissions-error'
import { PagePermissionRow } from './page-permission-row'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import type { Page } from '../types'

interface ShareDropdownContainerProps {
  page: Page
}

export function ShareDropdownContainer({ page }: ShareDropdownContainerProps) {
  const query = useInfiniteQuery(
    pagePermissionsInfiniteQueryOptions(page.workspaceId, page.id),
  )
  const { data: managePerm } = useQuery(
    canQueryOptions({
      permission: 'page:managePermissions',
      target: { pageId: page.id },
      workspaceId: page.workspaceId,
    }),
  )

  const canManage = managePerm?.allowed ?? false
  const permissions = query.data?.pages.flatMap((p) => p.payload) ?? []

  const permissionsSlot = query.isPending ? (
    <SharePermissionsLoading />
  ) : query.isError ? (
    <SharePermissionsError
      message={query.error.message}
      onRetry={() => query.refetch()}
    />
  ) : (
    <div className="max-h-60 overflow-y-auto divide-y">
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        fetchNextPage={query.fetchNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
      >
        {permissions.map((permission) => (
          <PagePermissionRow
            key={permission.userId}
            workspaceId={page.workspaceId}
            pageId={page.id}
            permission={permission}
            canManage={canManage}
          />
        ))}
      </InfiniteScroll>
    </div>
  )

  return (
    <ShareDropdownPresenter
      page={page}
      permissions={permissions}
      permissionsSlot={permissionsSlot}
      canManage={canManage}
    />
  )
}
