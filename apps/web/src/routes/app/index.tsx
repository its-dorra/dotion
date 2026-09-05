import { createFileRoute, redirect } from '@tanstack/react-router'
import { workspacesListQueryOptions } from '@/features/workspaces/query-options'

export const Route = createFileRoute('/app/')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const workspaces = await queryClient.ensureQueryData(
      workspacesListQueryOptions(),
    )
    const firstWorkspace = workspaces?.[0]
    if (firstWorkspace) {
      throw redirect({
        to: '/app/workspaces/$workspaceId',
        params: { workspaceId: firstWorkspace.id },
      })
    }
    throw redirect({ to: '/app/workspaces' })
  },
})
