import { Suspense } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { WorkspaceSettings } from '@/features/workspaces/components/workspace-settings'
import { GeneralSettingsLoading } from '@/features/workspaces/components/general-settings-loading'
import { workspaceDetailQueryOptions } from '@/features/workspaces/query-options'
import { WorkspaceNotFoundError } from '@/features/workspaces/errors'
import { NotFoundError } from '@/lib/errors'
import { GeneralSettingsError } from '@/features/workspaces/components/general-settings-error'
import { SettingsNotFound } from '@/features/workspaces/components/settings-not-found'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

export const Route = createFileRoute('/app/workspaces/$workspaceId/settings/')({
  loader: async ({ context: { queryClient }, params }) => {
    try {
      await queryClient.ensureQueryData(
        workspaceDetailQueryOptions(params.workspaceId),
      )
    } catch (error) {
      if (WorkspaceNotFoundError.is(error) || NotFoundError.is(error)) {
        throw notFound()
      }
      throw error
    }
  },
  component: WorkspaceSettingsPage,
  errorComponent: GeneralSettingsError,
  notFoundComponent: SettingsNotFound,
})

function WorkspaceSettingsPage() {
  const { workspaceId } = Route.useParams()

  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<GeneralSettingsLoading />}>
        <WorkspaceSettings workspaceId={workspaceId as WorkspaceId} />
      </Suspense>
    </div>
  )
}
