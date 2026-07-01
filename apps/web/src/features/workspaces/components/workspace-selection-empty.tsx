import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceSelectionEmptyProps {
  onCreateWorkspace: () => void;
}

export function WorkspaceSelectionEmpty({
  onCreateWorkspace,
}: WorkspaceSelectionEmptyProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-3 px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Building2 className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium">No workspaces yet</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Create a workspace to start organizing pages with your team.
      </p>
      <Button onClick={onCreateWorkspace} className="mt-2">
        Create workspace
      </Button>
    </div>
  );
}
