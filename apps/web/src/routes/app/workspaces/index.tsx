import { Suspense } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { WorkspaceSelection } from '@/features/workspaces/components/workspace-selection'
import { WorkspaceSelectionLoading } from '@/features/workspaces/components/workspace-selection-loading'
import { workspacesListQueryOptions } from '@/features/workspaces/query-options'
import { WorkspaceSelectionError } from '@/features/workspaces/components/workspace-selection-error'
import { WorkspaceSelectionNotFound } from '@/features/workspaces/components/workspace-selection-not-found'
import { NotFoundError } from '@/lib/errors'

export const Route = createFileRoute('/app/workspaces/')({
  component: WorkspaceSelectionPage,
  loader: async ({ context: { queryClient } }) => {
    try {
      return await queryClient.ensureQueryData(workspacesListQueryOptions())
    } catch (error) {
      if (NotFoundError.is(error)) {
        throw notFound()
      }
      throw error
    }
  },
  errorComponent: WorkspaceSelectionError,
  notFoundComponent: WorkspaceSelectionNotFound,
  ssr: 'data-only',
})

function WorkspaceSelectionPage() {
  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<WorkspaceSelectionLoading />}>
        <WorkspaceSelection />
      </Suspense>
    </div>
  )
}
