import { ChevronsUpDown, Plus, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkspaceIcon } from "./workspace-icon";
import type { Workspace } from "../types";

interface WorkspaceSwitcherPresenterProps {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
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
          <WorkspaceIcon icon={currentWorkspace.icon} name={currentWorkspace.name} />
          <span className="flex-1 truncate">{currentWorkspace.name}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onSelect={() => onSelectWorkspace(workspace.id)}
            className="gap-2"
          >
            <WorkspaceIcon icon={workspace.icon} name={workspace.name} size="sm" />
            <span className="flex-1 truncate">{workspace.name}</span>
            {workspace.id === currentWorkspace.id ? (
              <Check className="h-4 w-4" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onCreateWorkspace} className="gap-2">
          <Plus className="h-4 w-4" />
          New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
