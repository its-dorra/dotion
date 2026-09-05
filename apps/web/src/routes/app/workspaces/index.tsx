import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceSelection } from '@/features/workspaces/components/workspace-selection'
import { WorkspaceSelectionLoading } from '@/features/workspaces/components/workspace-selection-loading'
import { workspacesListQueryOptions } from '@/features/workspaces/query-options'

export const Route = createFileRoute('/app/workspaces/')({
  component: WorkspaceSelectionPage,
  loader: async ({ context: { queryClient } }) => {
    return await queryClient.ensureQueryData(workspacesListQueryOptions())
  },
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
