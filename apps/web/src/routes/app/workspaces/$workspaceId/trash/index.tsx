import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Trash } from '@/features/pages/components/trash'
import { TrashLoading } from '@/features/pages/components/trash-loading'
import { trashedPagesQueryOptions } from '@/features/pages/query-options'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

export const Route = createFileRoute('/app/workspaces/$workspaceId/trash/')({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(
      trashedPagesQueryOptions(params.workspaceId as WorkspaceId),
    )
  },
  component: TrashPage,
})

function TrashPage() {
  const { workspaceId } = Route.useParams()

  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<TrashLoading />}>
        <Trash workspaceId={workspaceId} />
      </Suspense>
    </div>
  )
}
