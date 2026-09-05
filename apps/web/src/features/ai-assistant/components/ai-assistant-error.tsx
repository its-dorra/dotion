import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiAssistantErrorProps {
  message: string;
  onRetry: () => void;
}

export function AiAssistantError({ message, onRetry }: AiAssistantErrorProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
