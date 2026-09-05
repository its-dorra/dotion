import { Link } from "@tanstack/react-router";
import { FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageDetailErrorProps {
  message: string;
  workspaceId: string;
  onRetry: () => void;
}

export function PageDetailError({
  message,
  workspaceId,
  onRetry,
}: PageDetailErrorProps) {
  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FileX className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-medium">Couldn't open this page</h2>
      <p className="text-sm text-muted-foreground">{message}</p>
      <div className="mt-2 flex gap-2">
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
        <Button asChild>
          <Link
            to="/app/workspaces/$workspaceId/pages/$pageId"
            params={{ workspaceId, pageId: "root" }}
          >
            Back to workspace
          </Link>
        </Button>
      </div>
    </div>
  );
}
