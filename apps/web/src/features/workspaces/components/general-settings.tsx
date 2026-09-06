import { useState, type FormEvent } from 'react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
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
      resource: {
        type: 'workspace',
        id: { workspaceId: workspaceId as WorkspaceId },
      },
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
    await updateWorkspace.mutateAsync({
      workspaceId: workspaceId as WorkspaceId,
      name: name.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-4">
        <WorkspaceIcon icon={workspace.icon} name={workspace.name} size="lg" />
        <div className="flex-1 space-y-2">
          <Label htmlFor="workspace-name-setting">
            {m.workspace_settings_title()}
          </Label>
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
          {m.auth_save_changes()}
        </Button>
      ) : null}
    </form>
  )
}
