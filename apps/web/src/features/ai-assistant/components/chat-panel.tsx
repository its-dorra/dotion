import { ChatMessage } from "./chat-message";
import { ChatEmpty } from "./chat-empty";
import { SuggestedActions } from "./suggested-actions";
import { PromptInput } from "./prompt-input";
import type { AssistantMessage, SuggestedAction } from "../types";

interface ChatPanelProps {
  messages: AssistantMessage[];
  suggestedActions: SuggestedAction[];
  onSend: (content: string) => void;
  isSending: boolean;
}

export function ChatPanel({
  messages,
  suggestedActions,
  onSend,
  isSending,
}: ChatPanelProps) {
  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <ChatEmpty
            suggestedActions={suggestedActions}
            onSelectAction={onSend}
            disabled={isSending}
          />
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        {isSending ? (
          <div className="flex justify-start">
            <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              Thinking…
            </div>
          </div>
        ) : null}
      </div>
      {messages.length > 0 ? (
        <div className="border-t p-3 pb-0">
          <SuggestedActions
            actions={suggestedActions}
            onSelect={onSend}
            disabled={isSending}
          />
        </div>
      ) : null}
      <PromptInput onSend={onSend} isSending={isSending} />
    </div>
  );
}
