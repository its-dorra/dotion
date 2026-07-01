import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { PageTreeContainer } from "@/features/pages";
import { cn } from "@/lib/utils";

interface HomePanelProps {
  workspaceId: string;
  activePageId?: string;
  isTrashActive?: boolean;
}

export function HomePanel({
  workspaceId,
  activePageId,
  isTrashActive,
}: HomePanelProps) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-1 py-2">
      <PageTreeContainer workspaceId={workspaceId} activePageId={activePageId} />
      <div className="mt-auto pt-2">
        <Link
          to="/app/workspaces/$workspaceId/trash"
          params={{ workspaceId }}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            isTrashActive && "bg-accent text-foreground",
          )}
        >
          <Trash2 className="h-4 w-4" />
          Trash
        </Link>
      </div>
    </div>
  );
}
