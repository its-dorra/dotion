import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceCard } from "./workspace-card";
import type { Workspace } from "../types";

interface WorkspaceSelectionPresenterProps {
  workspaces: Workspace[];
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: () => void;
}

export function WorkspaceSelectionPresenter({
  workspaces,
  onSelectWorkspace,
  onCreateWorkspace,
}: WorkspaceSelectionPresenterProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Choose a workspace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a workspace to continue, or create a new one.
          </p>
        </div>
        <Button onClick={onCreateWorkspace} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New workspace
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            onSelect={onSelectWorkspace}
          />
        ))}
      </div>
    </div>
  );
}
