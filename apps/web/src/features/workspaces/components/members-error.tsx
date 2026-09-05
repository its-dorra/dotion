import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MembersErrorProps {
  message: string;
  onRetry: () => void;
}

export function MembersError({ message, onRetry }: MembersErrorProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
