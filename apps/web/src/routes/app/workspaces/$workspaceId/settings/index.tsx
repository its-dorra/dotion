import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { WorkspaceSettings } from '@/features/workspaces/components/workspace-settings'
import { GeneralSettingsLoading } from '@/features/workspaces/components/general-settings-loading'
import { workspaceDetailQueryOptions } from '@/features/workspaces/query-options'

export const Route = createFileRoute('/app/workspaces/$workspaceId/settings/')({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(
      workspaceDetailQueryOptions(params.workspaceId),
    )
  },
  component: WorkspaceSettingsPage,
})

function WorkspaceSettingsPage() {
  const { workspaceId } = Route.useParams()

  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<GeneralSettingsLoading />}>
        <WorkspaceSettings workspaceId={workspaceId} />
      </Suspense>
    </div>
  )
}
