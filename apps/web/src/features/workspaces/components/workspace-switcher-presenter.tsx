import { ChevronsUpDown, Plus, Check, Building2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WorkspaceIcon } from './workspace-icon'
import type { Workspace } from '@dotion/shared/workspaces/types'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '../types'

interface WorkspaceSwitcherPresenterProps {
  currentWorkspace?: Workspace
  workspaces: Workspace[]
  onSelectWorkspace: (workspaceId: WorkspaceId) => void
  onCreateWorkspace: () => void
}

export function WorkspaceSwitcherPresenter({
  currentWorkspace,
  workspaces,
  onSelectWorkspace,
  onCreateWorkspace,
}: WorkspaceSwitcherPresenterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {currentWorkspace ? (
            <WorkspaceIcon name={currentWorkspace.name} />
          ) : (
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
              aria-hidden="true"
            >
              <Building2 className="h-4 w-4" />
            </div>
          )}
          <span
            className={`flex-1 truncate ${
              !currentWorkspace ? 'text-muted-foreground font-normal' : ''
            }`}
          >
            {currentWorkspace
              ? currentWorkspace.name
              : m.workspace_select_placeholder()}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {m.workspace_switcher_title()}
        </DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onSelect={() => onSelectWorkspace(workspace.id)}
            className="gap-2"
          >
            <WorkspaceIcon name={workspace.name} size="sm" />
            <span className="flex-1 truncate">{workspace.name}</span>
            {currentWorkspace && workspace.id === currentWorkspace.id ? (
              <Check className="h-4 w-4" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCreateWorkspace} className="gap-2">
          <Plus className="h-4 w-4" />
          {m.workspace_create_new()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
