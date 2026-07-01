import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvitationsErrorProps {
  message: string;
  onRetry: () => void;
}

export function InvitationsError({ message, onRetry }: InvitationsErrorProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
