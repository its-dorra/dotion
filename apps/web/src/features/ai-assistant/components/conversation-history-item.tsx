import { cn } from "@/lib/utils";
import type { AssistantConversation } from "../types";

interface ConversationHistoryItemProps {
  conversation: AssistantConversation;
  isActive: boolean;
  onSelect: (conversationId: string) => void;
}

export function ConversationHistoryItem({
  conversation,
  isActive,
  onSelect,
}: ConversationHistoryItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={cn(
        "w-full truncate rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
        isActive ? "bg-accent font-medium" : "text-muted-foreground",
      )}
    >
      {conversation.title}
    </button>
  );
}
