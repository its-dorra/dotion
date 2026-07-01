import { Sparkles } from "lucide-react";
import { SuggestedActions } from "./suggested-actions";
import type { SuggestedAction } from "../types";

interface ChatEmptyProps {
  suggestedActions: SuggestedAction[];
  onSelectAction: (prompt: string) => void;
  disabled?: boolean;
}

export function ChatEmpty({
  suggestedActions,
  onSelectAction,
  disabled,
}: ChatEmptyProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Sparkles className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        Ask anything about this page, or try a suggestion below.
      </p>
      <SuggestedActions
        actions={suggestedActions}
        onSelect={onSelectAction}
        disabled={disabled}
      />
    </div>
  );
}
