import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { workspacesListQueryOptions } from '../query-options'
import { WorkspaceSwitcherPresenter } from './workspace-switcher-presenter'
import { WorkspaceSwitcherLoading } from './workspace-switcher-loading'
import { WorkspaceSwitcherError } from './workspace-switcher-error'
import { WorkspaceSwitcherEmpty } from './workspace-switcher-empty'
import { CreateWorkspaceModal } from './create-workspace-modal'
import type { WorkspaceId } from '../types'

interface WorkspaceSwitcherContainerProps {
  currentWorkspaceId?: string
}

export function WorkspaceSwitcherContainer({
  currentWorkspaceId,
}: WorkspaceSwitcherContainerProps) {
  const navigate = useNavigate()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const query = useQuery(workspacesListQueryOptions())
  const workspaces = query.data

  const currentWorkspace = currentWorkspaceId
    ? workspaces?.find((w) => w.id === currentWorkspaceId)
    : undefined

  function handleSelectWorkspace(workspaceId: WorkspaceId) {
    navigate({
      to: '/app/workspaces/$workspaceId',
      params: { workspaceId },
    })
  }

  if (query.isPending) {
    return <WorkspaceSwitcherLoading />
  }

  if (query.isError) {
    return (
      <WorkspaceSwitcherError
        message="Couldn't load workspaces."
        onRetry={() => query.refetch()}
      />
    )
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <>
        <WorkspaceSwitcherEmpty
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
    <>
      <WorkspaceSwitcherPresenter
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={() => setCreateDialogOpen(true)}
      />
      <CreateWorkspaceModal
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </>
  )
}
