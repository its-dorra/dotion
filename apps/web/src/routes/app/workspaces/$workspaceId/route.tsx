import * as React from 'react'
import { createFileRoute, Outlet } from '@tanstack/react-router'
import WorkspaceWsProvider from '@/features/workspaces/components/workspace-ws-context'
import { useWorkspaceRealtime } from '@/features/workspaces/hooks/use-workspace-realtime'
import { SearchDialog } from '@/features/search/components/search-dialog'
import { AiAssistantContainer } from '@/features/ai-assistant/components/ai-assistant-container'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import { pageTreeQueryOptions } from '@/features/pages/query-options'
import { WorkspaceLayoutError } from '@/features/workspaces/components/workspace-layout-error'
import { WorkspaceNotFound } from '@/features/workspaces/components/workspace-not-found'

export const Route = createFileRoute('/app/workspaces/$workspaceId')({
  loader: async ({ context: { queryClient }, params }) => {
    void queryClient.prefetchQuery(
      pageTreeQueryOptions(params.workspaceId as WorkspaceId),
    )
  },
  component: RouteComponent,
  errorComponent: WorkspaceLayoutError,
  notFoundComponent: WorkspaceNotFound,
})

function RouteComponent() {
  const { workspaceId } = Route.useParams()
  const [searchOpen, setSearchOpen] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
    }

    const handleCustomOpen = () => setSearchOpen(true)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('dotion:open-search', handleCustomOpen)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('dotion:open-search', handleCustomOpen)
    }
  }, [])

  return (
    <WorkspaceWsProvider workspaceId={workspaceId as WorkspaceId}>
      <HandleWsRealtime />
      <Outlet />
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        workspaceId={workspaceId as WorkspaceId}
      />
      <AiAssistantContainer workspaceId={workspaceId as WorkspaceId} />
    </WorkspaceWsProvider>
  )
}

function HandleWsRealtime() {
  useWorkspaceRealtime()

  return null
}
