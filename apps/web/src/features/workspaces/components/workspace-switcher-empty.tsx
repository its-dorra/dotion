import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceSwitcherEmptyProps {
  onCreateWorkspace: () => void;
}

export function WorkspaceSwitcherEmpty({
  onCreateWorkspace,
}: WorkspaceSwitcherEmptyProps) {
  return (
    <button
      type="button"
      onClick={onCreateWorkspace}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <Building2 className="h-4 w-4" />
      <span className="flex-1">Create a workspace</span>
      <Plus className="h-4 w-4" />
    </button>
  );
}
