import { Suspense } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { WorkspaceDashboard } from '@/features/workspaces/components/workspace-dashboard'
import { WorkspaceDashboardLoading } from '@/features/workspaces/components/workspace-dashboard-loading'
import { workspaceDetailQueryOptions } from '@/features/workspaces/query-options'
import { pageTreeQueryOptions } from '@/features/pages/query-options'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import { WorkspaceNotFoundError } from '@/features/workspaces/errors'
import { NotFoundError } from '@/lib/errors'
import { WorkspaceDashboardError } from '@/features/workspaces/components/workspace-dashboard-error'
import { WorkspaceDashboardNotFound } from '@/features/workspaces/components/workspace-dashboard-not-found'

export const Route = createFileRoute('/app/workspaces/$workspaceId/')({
  loader: async ({ context: { queryClient }, params }) => {
    const workspaceId = params.workspaceId as WorkspaceId
    try {
      await Promise.all([
        queryClient.query(workspaceDetailQueryOptions(workspaceId)),
        queryClient.query(pageTreeQueryOptions(workspaceId)),
      ])
    } catch (error) {
      if (WorkspaceNotFoundError.is(error) || NotFoundError.is(error)) {
        throw notFound()
      }
      throw error
    }
  },
  component: WorkspaceIndexPage,
  errorComponent: WorkspaceDashboardError,
  notFoundComponent: WorkspaceDashboardNotFound,
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
