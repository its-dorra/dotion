import { Button } from "@/components/ui/button";
import type { SuggestedAction } from "../types";

interface SuggestedActionsProps {
  actions: SuggestedAction[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestedActions({
  actions,
  onSelect,
  disabled,
}: SuggestedActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(action.prompt)}
          className="h-7 text-xs"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
