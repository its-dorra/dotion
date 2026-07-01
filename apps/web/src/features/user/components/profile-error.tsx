import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileErrorProps {
  message: string;
  onRetry: () => void;
}

export function ProfileError({ message, onRetry }: ProfileErrorProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 px-6 py-24 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="font-medium">Couldn't load your profile</p>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
