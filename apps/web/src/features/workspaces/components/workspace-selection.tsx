import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { workspacesListQueryOptions } from '../query-options'
import { useCreateWorkspace } from '../hooks/use-create-workspace'
import { WorkspaceCard } from './workspace-card'
import { WorkspaceSelectionEmpty } from './workspace-selection-empty'
import { CreateWorkspaceModal } from './create-workspace-modal'

export function WorkspaceSelection() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const navigate = useNavigate()
  const { data: workspaces } = useSuspenseQuery(workspacesListQueryOptions())
  const createWorkspace = useCreateWorkspace()

  function navigateToWorkspace(workspaceId: string) {
    navigate({
      to: '/app/workspaces/$workspaceId',
      params: { workspaceId },
    })
  }

  async function handleCreateWorkspace(name: string) {
    try {
      await createWorkspace.mutateAsync({ name, icon: null })
      setCreateDialogOpen(false)
    } catch {
      // Error handled by mutation hook or modal state
    }
  }

  if (workspaces.length === 0) {
    return (
      <>
        <WorkspaceSelectionEmpty
          onCreateWorkspace={() => setCreateDialogOpen(true)}
        />
        <CreateWorkspaceModal
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={handleCreateWorkspace}
          isSubmitting={createWorkspace.isPending}
          errorMessage={
            createWorkspace.isError ? createWorkspace.error.message : undefined
          }
        />
      </>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      {/* Mobile Sidebar Trigger */}
      <div className="mb-6 flex items-center gap-2 md:hidden">
        <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
      </div>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Choose a workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a workspace to continue, or create a new one.
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          New workspace
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            onSelect={navigateToWorkspace}
          />
        ))}
      </div>
      <CreateWorkspaceModal
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateWorkspace}
        isSubmitting={createWorkspace.isPending}
        errorMessage={
          createWorkspace.isError ? createWorkspace.error.message : undefined
        }
      />
    </div>
  )
}
