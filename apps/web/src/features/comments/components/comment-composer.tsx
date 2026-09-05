import { useState, type FormEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentComposerProps {
  onSubmit: (body: string) => void;
  isSubmitting: boolean;
  placeholder?: string;
}

export function CommentComposer({
  onSubmit,
  isSubmitting,
  placeholder = "Add a comment…",
}: CommentComposerProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit(value.trim());
    setValue("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        rows={1}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit(event);
          }
        }}
        className="flex-1 resize-none rounded-md border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
      />
      <Button
        type="submit"
        size="icon"
        className="h-9 w-9 shrink-0"
        disabled={isSubmitting || !value.trim()}
        aria-label="Send comment"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </form>
  );
}
