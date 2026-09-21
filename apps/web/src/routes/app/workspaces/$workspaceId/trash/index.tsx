import { Suspense } from 'react'
import { createFileRoute, notFound } from '@tanstack/react-router'
import { Trash } from '@/features/pages/components/trash'
import { TrashLoading } from '@/features/pages/components/trash-loading'
import { trashedPagesQueryOptions } from '@/features/pages/query-options'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import { WorkspaceNotFoundError } from '@/features/workspaces/errors'
import { NotFoundError } from '@/lib/errors'
import { TrashError } from '@/features/pages/components/trash-error'
import { TrashNotFound } from '@/features/pages/components/trash-not-found'

export const Route = createFileRoute('/app/workspaces/$workspaceId/trash/')({
  loader: async ({ context: { queryClient }, params }) => {
    try {
      await queryClient.query(
        trashedPagesQueryOptions(params.workspaceId as WorkspaceId),
      )
    } catch (error) {
      if (WorkspaceNotFoundError.is(error) || NotFoundError.is(error)) {
        throw notFound()
      }
      throw error
    }
  },
  component: TrashPage,
  errorComponent: TrashError,
  notFoundComponent: TrashNotFound,
})

function TrashPage() {
  const { workspaceId } = Route.useParams()

  return (
    <div className="h-full overflow-y-auto">
      <Suspense fallback={<TrashLoading />}>
        <Trash workspaceId={workspaceId as WorkspaceId} />
      </Suspense>
    </div>
  )
}
