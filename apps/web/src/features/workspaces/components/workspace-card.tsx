import { Users } from "lucide-react";
import { WorkspaceIcon } from "./workspace-icon";
import type { Workspace } from "../types";

interface WorkspaceCardProps {
  workspace: Workspace;
  onSelect: (workspaceId: string) => void;
}

export function WorkspaceCard({ workspace, onSelect }: WorkspaceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(workspace.id)}
      className="flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <WorkspaceIcon icon={workspace.icon} name={workspace.name} size="lg" />
      <div className="min-w-0">
        <p className="truncate font-medium">{workspace.name}</p>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {workspace.memberCount}{" "}
          {workspace.memberCount === 1 ? "member" : "members"}
        </p>
      </div>
    </button>
  );
}
