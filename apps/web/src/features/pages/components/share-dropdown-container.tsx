import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { pagePermissionsInfiniteQueryOptions } from '../query-options'
import { canQueryOptions } from '@/features/authorization/query-options'
import { useInviteToPage } from '../hooks/use-invite-to-page'
import { useUpdatePagePermission } from '../hooks/use-update-page-permission'
import { useSetPagePublic } from '../hooks/use-set-page-public'
import { ShareDropdownPresenter } from './share-dropdown-presenter'
import { SharePermissionsLoading } from './share-permissions-loading'
import { SharePermissionsError } from './share-permissions-error'
import { PagePermissionRow } from './page-permission-row'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import * as m from '@/paraglide/messages'
import type { Page, PagePermissionRole } from '../types'

interface ShareDropdownContainerProps {
  page: Page
}

export function ShareDropdownContainer({ page }: ShareDropdownContainerProps) {
  const query = useInfiniteQuery(
    pagePermissionsInfiniteQueryOptions(page.workspaceId, page.id),
  )
  const { data: managePerm } = useQuery(
    canQueryOptions({
      resource: { type: 'page', id: { pageId: page.id } },
      action: 'managePermissions',
    }),
  )
  const inviteToPage = useInviteToPage()
  const updatePermission = useUpdatePagePermission()
  const setPagePublic = useSetPagePublic()

  const canManage = managePerm?.allowed ?? false

  async function handleInvite(email: string, role: PagePermissionRole) {
    try {
      await inviteToPage.mutateAsync({
        workspaceId: page.workspaceId,
        pageId: page.id,
        email,
        role,
      })
      toast.success(m.toast_page_invite_success({ email }))
    } catch (error: any) {
      toast.error(error?.message ?? m.toast_page_invite_failed())
    }
  }

  async function handleChangeRole(userId: string, role: PagePermissionRole) {
    try {
      await updatePermission.mutateAsync({
        workspaceId: page.workspaceId,
        pageId: page.id,
        userId: userId as any,
        role,
      })
      toast.success(m.toast_permission_updated())
    } catch (error: any) {
      toast.error(error?.message ?? m.toast_permission_update_failed())
    }
  }

  async function handleTogglePublic(isPublic: boolean) {
    try {
      await setPagePublic.mutateAsync({
        pageId: page.id,
        isPublic,
      })
      toast(isPublic ? m.toast_page_public() : m.toast_page_private())
    } catch (error: any) {
      toast.error(error?.message ?? m.toast_page_public_access_update_failed())
    }
  }

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
            permission={permission}
            canManage={canManage}
            onChangeRole={handleChangeRole}
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
      onInvite={handleInvite}
      isInviting={inviteToPage.isPending}
      inviteErrorMessage={inviteToPage.error?.message}
      onChangeRole={handleChangeRole}
      onTogglePublic={handleTogglePublic}
      isUpdatingPublic={setPagePublic.isPending}
    />
  )
}
