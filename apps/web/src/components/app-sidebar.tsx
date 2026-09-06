import { useState } from 'react'
import { useParams, useMatchRoute } from '@tanstack/react-router'
import { Home, Bell } from 'lucide-react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { WorkspaceSwitcherContainer } from '@/features/workspaces/components/workspace-switcher-container'
import { UserMenuContainer } from '@/features/auth/components/user-menu-container'
import { NotificationsContainer } from '@/features/notifications/components/notifications-container'
import { notificationsInfiniteQueryOptions } from '@/features/notifications/query-options'
import LanguageToggle from '@/components/common/language-toggle'
import ThemeToggle from '@/components/common/theme-toggle'
import { HomePanel } from './home-panel'
import { SidebarNavButton } from './sidebar-nav-button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import { m } from '@/paraglide/messages'
import { getTextDirection } from '@/paraglide/runtime'

type SidebarPanel = 'home' | 'notifications'

export function AppSidebar({
  workspaceId,
}: { workspaceId?: WorkspaceId } = {}) {
  const matchRoute = useMatchRoute()
  const params = useParams({ strict: false })

  const activeWorkspaceId =
    workspaceId ?? (params.workspaceId as WorkspaceId | undefined)

  const isTrashRoute = Boolean(
    matchRoute({ to: '/app/workspaces/$workspaceId/trash', fuzzy: false }),
  )

  const [panel, setPanel] = useState<SidebarPanel>('home')

  const notificationsQuery = useInfiniteQuery(
    notificationsInfiniteQueryOptions(),
  )

  const hasUnread =
    notificationsQuery.data?.pages.some((page) =>
      page.payload.some((n) => !n.isRead),
    ) ?? false

  const dir = getTextDirection()
  const side = dir === 'rtl' ? 'right' : 'left'

  return (
    <Sidebar dir={dir} side={side} collapsible="icon" className="border-r">
      <SidebarHeader className="gap-2 border-b p-2">
        <div className="flex items-center justify-between gap-1">
          <div className="min-w-0 flex-1">
            <UserMenuContainer currentWorkspaceId={activeWorkspaceId} />
          </div>
          <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 group-data-[collapsible=icon]:hidden" />
        </div>

        <WorkspaceSwitcherContainer
          currentWorkspaceId={activeWorkspaceId}
          onResolveWorkspace={() => {}}
        />
      </SidebarHeader>
      <SidebarContent className="gap-3 p-2">
        <div>
          <SidebarGroupLabel>{m.sidebar_navigation()}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="flex flex-row gap-2">
              <SidebarMenuItem>
                <SidebarNavButton
                  icon={Home}
                  label={m.sidebar_home()}
                  isActive={panel === 'home'}
                  onClick={() => setPanel('home')}
                />
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarNavButton
                  icon={Bell}
                  label={m.notifications_title()}
                  isActive={panel === 'notifications'}
                  onClick={() => setPanel('notifications')}
                  badge={hasUnread}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </div>

        <div className="mt-1 flex min-h-0 flex-1 flex-col overflow-hidden">
          {panel === 'home' ? (
            <HomePanel
              workspaceId={activeWorkspaceId}
              activePageId={params.pageId}
              isTrashActive={isTrashRoute}
            />
          ) : (
            <div className="flex-1 overflow-y-auto px-1 py-2">
              <NotificationsContainer />
            </div>
          )}
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <div className="flex items-center justify-between gap-1 group-data-[collapsible=icon]:flex-col">
          <LanguageToggle
            side="top"
            align="start"
            className="h-8 text-xs group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:px-0"
          />
          <ThemeToggle side="top" align="end" />
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
