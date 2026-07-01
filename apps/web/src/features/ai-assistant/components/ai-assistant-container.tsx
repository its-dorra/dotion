import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  suggestedActionsQueryOptions,
  conversationsQueryOptions,
} from "../query-options";
import { useSendMessage } from "../hooks/use-send-message";
import { AiAssistantTrigger } from "./ai-assistant-trigger";
import { AiAssistantDrawerPresenter } from "./ai-assistant-drawer-presenter";
import { AiAssistantLoading } from "./ai-assistant-loading";
import { AiAssistantError } from "./ai-assistant-error";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface AiAssistantContainerProps {
  pageId: string;
}

export function AiAssistantContainer({ pageId }: AiAssistantContainerProps) {
  const [open, setOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | undefined
  >();

  // Conversations are scoped per-page. AiAssistantContainer is mounted once
  // at the /app layout level and only swaps which pageId it's given as
  // navigation happens — it doesn't remount — so without this, switching
  // pages while a conversation is selected would leave a stale (and
  // possibly nonexistent) conversation id active against the new page.
  useEffect(() => {
    setActiveConversationId(undefined);
  }, [pageId]);

  const suggestedActionsQuery = useQuery(suggestedActionsQueryOptions());
  const conversationsQuery = useQuery(conversationsQueryOptions(pageId));
  const sendMessage = useSendMessage();

  const conversations = conversationsQuery.data ?? [];
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  function handleSend(content: string) {
    sendMessage.mutate(
      { pageId, content, conversationId: activeConversationId },
      {
        onSuccess: (result) => {
          setActiveConversationId(result.conversationId);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
  }

  const isLoading =
    suggestedActionsQuery.isPending || conversationsQuery.isPending;
  const isError = suggestedActionsQuery.isError || conversationsQuery.isError;

  return (
    <>
      <AiAssistantTrigger onClick={() => setOpen(true)} />

      {isLoading || isError ? (
        <Sheet open={open} onOpenChange={handleOpenChange}>
          <SheetContent side="right" className="flex flex-col p-0 sm:max-w-md">
            <SheetHeader className="border-b p-4">
              <SheetTitle>AI Assistant</SheetTitle>
            </SheetHeader>
            {isLoading ? (
              <AiAssistantLoading />
            ) : (
              <AiAssistantError
                message="Couldn't load the assistant."
                onRetry={() => {
                  suggestedActionsQuery.refetch();
                  conversationsQuery.refetch();
                }}
              />
            )}
          </SheetContent>
        </Sheet>
      ) : (
        <AiAssistantDrawerPresenter
          open={open}
          onOpenChange={handleOpenChange}
          conversations={conversations}
          activeConversationId={activeConversationId}
          messages={activeConversation?.messages ?? []}
          suggestedActions={suggestedActionsQuery.data ?? []}
          onSelectConversation={setActiveConversationId}
          onNewConversation={() => setActiveConversationId(undefined)}
          onSend={handleSend}
          isSending={sendMessage.isPending}
        />
      )}
    </>
  );
}
