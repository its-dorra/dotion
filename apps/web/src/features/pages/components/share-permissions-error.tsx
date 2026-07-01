import { Button } from "@/components/ui/button";

interface SharePermissionsErrorProps {
  message: string;
  onRetry: () => void;
}

export function SharePermissionsError({
  message,
  onRetry,
}: SharePermissionsErrorProps) {
  return (
    <div className="py-2 text-xs text-muted-foreground">
      <p>{message}</p>
      <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
