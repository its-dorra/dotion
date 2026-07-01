export type MessageRole = "user" | "assistant";

export interface AssistantMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface AssistantConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: AssistantMessage[];
}

export interface SuggestedAction {
  id: string;
  label: string;
  prompt: string;
}

export interface SendMessageInput {
  conversationId?: string;
  pageId: string;
  content: string;
}

export interface SendMessageResult {
  conversationId: string;
  userMessage: AssistantMessage;
  assistantMessage: AssistantMessage;
}
