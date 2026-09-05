import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiAssistantTriggerProps {
  onClick: () => void;
}

export function AiAssistantTrigger({ onClick }: AiAssistantTriggerProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg"
      aria-label="Open AI assistant"
    >
      <Sparkles className="h-5 w-5" />
    </Button>
  );
}
