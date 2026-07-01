import { resultQueryOptions } from "@/integrations/tanstack-query/better-result/query-options";
import { aiAssistantApi } from "./api";

export const aiAssistantKeys = {
  all: ["ai-assistant"] as const,
  suggestedActions: () => [...aiAssistantKeys.all, "suggested-actions"] as const,
  conversations: (pageId: string) =>
    [...aiAssistantKeys.all, "conversations", pageId] as const,
  conversation: (pageId: string, conversationId: string) =>
    [...aiAssistantKeys.all, "conversation", pageId, conversationId] as const,
};

export function suggestedActionsQueryOptions() {
  return resultQueryOptions({
    queryKey: aiAssistantKeys.suggestedActions(),
    queryFn: () => aiAssistantApi.getSuggestedActions(),
    staleTime: 5 * 60_000,
  });
}

export function conversationsQueryOptions(pageId: string) {
  return resultQueryOptions({
    queryKey: aiAssistantKeys.conversations(pageId),
    queryFn: () => aiAssistantApi.getConversations(pageId),
    staleTime: 10_000,
    enabled: Boolean(pageId),
  });
}

export function conversationQueryOptions(
  pageId: string,
  conversationId: string,
) {
  return resultQueryOptions({
    queryKey: aiAssistantKeys.conversation(pageId, conversationId),
    queryFn: () => aiAssistantApi.getConversation(pageId, conversationId),
    staleTime: 10_000,
    enabled: Boolean(pageId) && Boolean(conversationId),
  });
}
