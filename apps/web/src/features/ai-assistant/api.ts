import { Result } from "better-result";
import { AppError } from "@/lib/errors";
import { ConversationNotFoundError, EmptyMessageError } from "./errors";
import type {
  AssistantConversation,
  AssistantMessage,
  SendMessageInput,
  SendMessageResult,
  SuggestedAction,
} from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const mockSuggestedActions: SuggestedAction[] = [
  {
    id: "sugg_1",
    label: "Summarize this page",
    prompt: "Summarize this page in a few bullet points.",
  },
  {
    id: "sugg_2",
    label: "Fix grammar",
    prompt: "Find and fix any grammar issues on this page.",
  },
  {
    id: "sugg_3",
    label: "Suggest next steps",
    prompt: "Based on this page, what should I do next?",
  },
  {
    id: "sugg_4",
    label: "Make it more concise",
    prompt: "Rewrite this page to be more concise.",
  },
];

let mockConversations: Record<string, AssistantConversation[]> = {
  page_root_1: [
    {
      id: "conv_1",
      title: "Summarize the roadmap",
      updatedAt: "2026-06-24T10:00:00.000Z",
      messages: [
        {
          id: "msg_1",
          role: "user",
          content: "Summarize this page in a few bullet points.",
          createdAt: "2026-06-24T09:59:00.000Z",
        },
        {
          id: "msg_2",
          role: "assistant",
          content:
            "Here's a quick summary:\n\n• The roadmap covers three phases: planning, build, and launch.\n• Phase one focuses on workspace and page infrastructure.\n• Phase two adds collaboration features like comments and sharing.\n• Phase three layers in realtime sync and the AI assistant.",
          createdAt: "2026-06-24T10:00:00.000Z",
        },
      ],
    },
  ],
};

function craftMockReply(prompt: string): string {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("summar")) {
    return "Here's a quick summary:\n\n• This page captures the key context so far.\n• The main ideas are organized under clear headings.\n• Nothing urgent looks unresolved right now.";
  }
  if (normalized.includes("grammar") || normalized.includes("concise")) {
    return "I've reviewed the writing. The tone is clear overall — a few sentences could be tightened, but nothing major stands out.";
  }
  if (normalized.includes("next step")) {
    return "Based on this page, a few good next steps:\n\n1. Confirm ownership for any open items.\n2. Add a target date if one is missing.\n3. Share the page with anyone who needs visibility.";
  }

  return "Got it — once realtime sync is wired up, I'll be able to read the live page content and give a more grounded answer. For now, here's a general response based on your message.";
}

export class AiAssistantApi {
  async getSuggestedActions(): Promise<Result<SuggestedAction[], AppError>> {
    await delay(200);
    return Result.ok([...mockSuggestedActions]);
  }

  async getConversations(
    pageId: string,
  ): Promise<Result<AssistantConversation[], AppError>> {
    await delay(350);
    return Result.ok(
      [...(mockConversations[pageId] ?? [])].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    );
  }

  async getConversation(
    pageId: string,
    conversationId: string,
  ): Promise<Result<AssistantConversation, ConversationNotFoundError>> {
    await delay(300);
    const conversation = mockConversations[pageId]?.find(
      (c) => c.id === conversationId,
    );
    if (!conversation) {
      return Result.err(
        new ConversationNotFoundError({
          message: "This conversation no longer exists.",
          conversationId,
        }),
      );
    }
    return Result.ok(conversation);
  }

  async sendMessage(
    input: SendMessageInput,
  ): Promise<Result<SendMessageResult, EmptyMessageError>> {
    await delay(700);

    if (!input.content.trim()) {
      return Result.err(
        new EmptyMessageError({ message: "Type a message first." }),
      );
    }

    const now = new Date().toISOString();
    const userMessage: AssistantMessage = {
      id: generateId("msg"),
      role: "user",
      content: input.content.trim(),
      createdAt: now,
    };
    const assistantMessage: AssistantMessage = {
      id: generateId("msg"),
      role: "assistant",
      content: craftMockReply(input.content),
      createdAt: new Date(Date.now() + 1).toISOString(),
    };

    const pageConversations = mockConversations[input.pageId] ?? [];
    const existingConversation = input.conversationId
      ? pageConversations.find((c) => c.id === input.conversationId)
      : undefined;

    // Build the updated conversation as a new object rather than mutating
    // an existing one in place — pageConversations (and anything a cached
    // query result is still holding a reference to) must stay untouched
    // until this new array replaces it below.
    const updatedConversation: AssistantConversation = existingConversation
      ? {
          ...existingConversation,
          messages: [
            ...existingConversation.messages,
            userMessage,
            assistantMessage,
          ],
          updatedAt: assistantMessage.createdAt,
        }
      : {
          id: generateId("conv"),
          title: input.content.trim().slice(0, 48),
          updatedAt: assistantMessage.createdAt,
          messages: [userMessage, assistantMessage],
        };

    mockConversations[input.pageId] = existingConversation
      ? pageConversations.map((c) =>
          c.id === updatedConversation.id ? updatedConversation : c,
        )
      : [...pageConversations, updatedConversation];

    return Result.ok({
      conversationId: updatedConversation.id,
      userMessage,
      assistantMessage,
    });
  }
}

export const aiAssistantApi = new AiAssistantApi();
