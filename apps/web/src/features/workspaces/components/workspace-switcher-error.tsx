import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceSwitcherErrorProps {
  message: string;
  onRetry: () => void;
}

export function WorkspaceSwitcherError({
  message,
  onRetry,
}: WorkspaceSwitcherErrorProps) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <span className="flex-1 truncate">{message}</span>
      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
