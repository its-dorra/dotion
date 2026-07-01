import { useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface PromptInputProps {
  onSend: (content: string) => void;
  isSending: boolean;
}

export function PromptInput({ onSend, isSending }: PromptInputProps) {
  const [value, setValue] = useState("");

  function handleSend() {
    if (!value.trim() || isSending) return;
    onSend(value.trim());
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex items-end gap-2 border-t p-3">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask the assistant about this page…"
        className="min-h-[40px] max-h-32"
        disabled={isSending}
      />
      <Button
        size="icon"
        className="h-9 w-9 shrink-0"
        disabled={!value.trim() || isSending}
        onClick={handleSend}
        aria-label="Send message"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
