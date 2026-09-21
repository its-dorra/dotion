import { createFileRoute, redirect } from '@tanstack/react-router'
import { workspacesListQueryOptions } from '@/features/workspaces/query-options'
import { AppRedirectError } from '@/features/workspaces/components/app-redirect-error'
import { AppRedirectNotFound } from '@/features/workspaces/components/app-redirect-not-found'

export const Route = createFileRoute('/app/')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const workspaces = await queryClient.query(
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
  errorComponent: AppRedirectError,
  notFoundComponent: AppRedirectNotFound,
})
