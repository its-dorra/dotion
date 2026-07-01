import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConversationHistoryItem } from "./conversation-history-item";
import type { AssistantConversation } from "../types";

interface ConversationHistoryPanelProps {
  conversations: AssistantConversation[];
  activeConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function ConversationHistoryPanel({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationHistoryPanelProps) {
  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between p-2">
        <span className="px-1 text-xs font-medium text-muted-foreground">
          History
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onNewConversation}
          aria-label="New conversation"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 space-y-0.5 overflow-y-auto p-1">
        {conversations.length === 0 ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">
            No conversations yet
          </p>
        ) : (
          conversations.map((conversation) => (
            <ConversationHistoryItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === activeConversationId}
              onSelect={onSelectConversation}
            />
          ))
        )}
      </div>
    </div>
  );
}
