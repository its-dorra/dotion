import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentsErrorProps {
  message: string;
  onRetry: () => void;
}

export function CommentsError({ message, onRetry }: CommentsErrorProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-6 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
