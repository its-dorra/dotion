import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { workspacesListQueryOptions } from '../query-options'
import { WorkspaceCard } from './workspace-card'
import { WorkspaceSelectionEmpty } from './workspace-selection-empty'
import { CreateWorkspaceModal } from './create-workspace-modal'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '../types';

export function WorkspaceSelection() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const navigate = useNavigate()
  const { data: workspaces } = useSuspenseQuery(workspacesListQueryOptions())

  function navigateToWorkspace(workspaceId: WorkspaceId) {
    navigate({
      to: '/app/workspaces/$workspaceId',
      params: { workspaceId },
    })
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
            {m.workspace_selection_heading()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {m.workspace_selection_subtitle()}
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {m.workspace_create_new()}
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
      />
    </div>
  )
}
