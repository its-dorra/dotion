import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageTreeErrorProps {
  message: string;
  onRetry: () => void;
}

export function PageTreeError({ message, onRetry }: PageTreeErrorProps) {
  return (
    <div className="flex flex-col items-start gap-1.5 px-2 py-2 text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
        {message}
      </span>
      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
