import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceDashboard } from '@/features/workspaces/components/workspace-dashboard'
import { WorkspaceDashboardLoading } from '@/features/workspaces/components/workspace-dashboard-loading'
import { workspaceDetailQueryOptions } from '@/features/workspaces/query-options'
import { pageTreeQueryOptions } from '@/features/pages/query-options'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

export const Route = createFileRoute('/app/workspaces/$workspaceId/')({
  loader: async ({ context: { queryClient }, params }) => {
    const workspaceId = params.workspaceId as WorkspaceId
    await Promise.all([
      queryClient.ensureQueryData(workspaceDetailQueryOptions(workspaceId)),
      queryClient.ensureQueryData(pageTreeQueryOptions(workspaceId)),
    ])
  },
  component: WorkspaceIndexPage,
})

function WorkspaceIndexPage() {
  const { workspaceId } = Route.useParams()

  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<WorkspaceDashboardLoading />}>
        <WorkspaceDashboard workspaceId={workspaceId as WorkspaceId} />
      </Suspense>
    </div>
  )
}
