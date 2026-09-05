import { useState, type FormEvent } from 'react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { workspaceDetailQueryOptions } from '../query-options'
import { canQueryOptions } from '@/features/authorization/query-options'
import { useUpdateWorkspace } from '../hooks/use-update-workspace'
import { WorkspaceIcon } from './workspace-icon'
import * as m from '@/paraglide/messages'
import type { WorkspaceId } from '../types'

interface GeneralSettingsProps {
  workspaceId: string
}

export function GeneralSettings({ workspaceId }: GeneralSettingsProps) {
  const { data: workspace } = useSuspenseQuery(
    workspaceDetailQueryOptions(workspaceId),
  )
  const { data: managePerm } = useQuery(
    canQueryOptions({
      resource: { type: 'workspace', id: { workspaceId: workspaceId as WorkspaceId } },
      action: 'manageSettings',
    }),
  )
  const updateWorkspace = useUpdateWorkspace()

  const [name, setName] = useState(workspace.name)
  const hasChanges = name.trim() !== workspace.name

  const canManage = managePerm?.allowed ?? false

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!hasChanges) return
    try {
      await updateWorkspace.mutateAsync({
        workspaceId: workspaceId as WorkspaceId,
        name: name.trim(),
      })
      toast.success(m.toast_workspace_updated())
    } catch (error: any) {
      toast.error(error?.message ?? m.toast_workspace_update_failed())
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <WorkspaceIcon icon={workspace.icon} name={workspace.name} size="lg" />
        <div className="flex-1 space-y-2">
          <Label htmlFor="workspace-name-setting">Workspace name</Label>
          <Input
            id="workspace-name-setting"
            value={name}
            disabled={!canManage}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
      </div>
      {updateWorkspace.error?.message ? (
        <p className="text-sm text-destructive">
          {updateWorkspace.error.message}
        </p>
      ) : null}
      {canManage ? (
        <Button
          type="submit"
          disabled={!hasChanges || updateWorkspace.isPending}
        >
          {updateWorkspace.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only the workspace owner can change these settings.
        </p>
      )}
    </form>
  )
}
