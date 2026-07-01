import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConversationHistoryPanel } from "./conversation-history-panel";
import { ChatPanel } from "./chat-panel";
import type { AssistantConversation, AssistantMessage, SuggestedAction } from "../types";

interface AiAssistantDrawerPresenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: AssistantConversation[];
  activeConversationId?: string;
  messages: AssistantMessage[];
  suggestedActions: SuggestedAction[];
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onSend: (content: string) => void;
  isSending: boolean;
}

export function AiAssistantDrawerPresenter({
  open,
  onOpenChange,
  conversations,
  activeConversationId,
  messages,
  suggestedActions,
  onSelectConversation,
  onNewConversation,
  onSend,
  isSending,
}: AiAssistantDrawerPresenterProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b p-4">
          <SheetTitle>AI Assistant</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden w-40 shrink-0 sm:block">
            <ConversationHistoryPanel
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={onSelectConversation}
              onNewConversation={onNewConversation}
            />
          </div>
          <ChatPanel
            messages={messages}
            suggestedActions={suggestedActions}
            onSend={onSend}
            isSending={isSending}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
