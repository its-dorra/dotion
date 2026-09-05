import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { workspacesListQueryOptions } from '../query-options'
import { useCreateWorkspace } from '../hooks/use-create-workspace'
import { WorkspaceSwitcherPresenter } from './workspace-switcher-presenter'
import { WorkspaceSwitcherLoading } from './workspace-switcher-loading'
import { WorkspaceSwitcherError } from './workspace-switcher-error'
import { WorkspaceSwitcherEmpty } from './workspace-switcher-empty'
import { CreateWorkspaceModal } from './create-workspace-modal'

interface WorkspaceSwitcherContainerProps {
  currentWorkspaceId?: string

  onResolveWorkspace?: (workspaceId: string) => void
}

export function WorkspaceSwitcherContainer({
  currentWorkspaceId,
  onResolveWorkspace,
}: WorkspaceSwitcherContainerProps) {
  const navigate = useNavigate()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const query = useQuery(workspacesListQueryOptions())
  const createWorkspace = useCreateWorkspace()

  const workspaces = query.data

  const currentWorkspace = currentWorkspaceId
    ? workspaces?.find((w) => w.id === currentWorkspaceId)
    : undefined

  useEffect(() => {
    if (currentWorkspace?.id) {
      onResolveWorkspace?.(currentWorkspace.id)
    }
  }, [currentWorkspace?.id, onResolveWorkspace])

  function handleSelectWorkspace(workspaceId: string) {
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
      // handled by mutation hook or error state
    }
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
          onSubmit={(name) => handleCreateWorkspace(name)}
          isSubmitting={createWorkspace.isPending}
          errorMessage={
            createWorkspace.isError ? createWorkspace.error.message : undefined
          }
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
        onSubmit={handleCreateWorkspace}
        isSubmitting={createWorkspace.isPending}
        errorMessage={
          createWorkspace.isError ? createWorkspace.error.message : undefined
        }
      />
    </>
  )
}
