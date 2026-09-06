import { authQueryOptions } from '@/features/auth/query-options'
import { useUserRealtime } from '@/features/notifications/hooks/use-user-realtime'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { workspacesListQueryOptions } from '@/features/workspaces/query-options'
import { notificationsInfiniteQueryOptions } from '@/features/notifications/query-options'
import { DocumentBackgroundLayer } from '@/features/pages/components/document-background-layer'
import { AppLayoutError } from '@/features/auth/components/app-layout-error'
import { AppLayoutNotFound } from '@/features/auth/components/app-layout-not-found'

export const Route = createFileRoute('/app')({
  beforeLoad: async ({ context: { authClient, queryClient } }) => {
    const session = await queryClient.ensureQueryData(
      authQueryOptions(authClient),
    )
    if (!session || !session.user) {
      throw redirect({
        to: '/',
      })
    }
  },
  loader: async ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(workspacesListQueryOptions())
    void queryClient.prefetchInfiniteQuery(notificationsInfiniteQueryOptions())
  },
  component: AppLayout,
  errorComponent: AppLayoutError,
  notFoundComponent: AppLayoutNotFound,
})

function AppLayout() {
  useUserRealtime()

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="relative overflow-hidden">
          <DocumentBackgroundLayer />
          <div className="relative z-10 flex h-full flex-1 flex-col overflow-hidden">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
