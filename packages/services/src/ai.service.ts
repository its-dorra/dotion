import { Result, TaggedError } from "better-result";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  streamText,
  generateText,
  convertToModelMessages,
  tool,
  type UIMessage,
  type ModelMessage,
} from "ai";
import {
  aiDocumentFormats,
  injectDocumentStateMessages,
  toolDefinitionsToToolSet,
} from "@blocknote/xl-ai/server";
import { z } from "zod";
import type { UserId } from "@dotion/shared/users/types";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserCreditsManager } from "./realtime.types";
import type { SearchService } from "./search.service";

export class AIError extends TaggedError("AIError")<{
  message: string;
  cause?: Error;
}> {}

export class QuotaExceededError extends TaggedError("QuotaExceededError")<{
  message: string;
  resetAt?: number;
}> {}

export interface AIUsageMetrics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

export type BlockNoteToolDefinitions = Parameters<
  typeof toolDefinitionsToToolSet
>[0];

export interface StreamEditorAIInput {
  userId: UserId;
  workspaceId?: WorkspaceId;
  messages: UIMessage[];
  toolDefinitions: BlockNoteToolDefinitions;
  systemPrompt?: string;
  onFinish?: (usage: AIUsageMetrics) => Promise<void> | void;
}

export interface StreamRAGInput {
  userId: UserId;
  history: { role: string; content: string }[];
  contextBlock: string;
  userPrompt: string;
  onFinish?: (text: string, usage: AIUsageMetrics) => Promise<void> | void;
}

export const STRICT_RAG_SYSTEM_PROMPT = `You are Dotion AI, a dedicated and factual workspace assistant. Your sole purpose is to help users understand, find, and synthesize information from their Dotion workspace documents and notes.

STRICT OPERATING RULES:
1. DOMAIN SCOPE: You ONLY answer questions related to the user's workspace documents, notes, projects, and Dotion content.
   - If the user asks general, out-of-domain questions (such as solving math puzzles, writing generic code algorithms unrelated to workspace notes, recipes, general world trivia, or open-ended chatting), immediately refuse by responding:
     "I am Dotion's workspace assistant. I can only assist with questions regarding your workspace documents, notes, and content."
2. FACTUAL GROUNDING: When answering workspace queries, rely EXCLUSIVELY on facts directly provided in the <workspace_context> below. Do NOT extrapolate, speculate, or fabricate details.
3. ABSENCE OF INFORMATION: If the provided context does not contain the answer, state clearly:
   "I cannot find this information in the workspace documents."
4. CITATIONS: Every factual claim must include a bracketed citation matching the source ID (e.g., [1], [2]).
   - Format: Place citation tags immediately after the corresponding statement.
   - Example: "Cloudflare KV stores session cookies [1], whereas vector embeddings are stored in Neon [2]."
   - Never invent or cite source IDs that are not present in <workspace_context>.
5. FORMATTING: Use clean Markdown with headers, bullet points, and code blocks where helpful.
6. LANGUAGE: Respond in the exact language of the user's prompt (English, French, or Arabic).`;

export class AIService {
  private readonly googleClient: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(
    apiKey: string,
    private readonly creditsManager?: UserCreditsManager,
    private readonly searchService?: SearchService,
  ) {
    this.googleClient = createGoogleGenerativeAI({ apiKey });
  }

  private async checkQuota(
    userId: UserId,
    minTokens = 50,
  ): Promise<Result<void, QuotaExceededError>> {
    if (!this.creditsManager) return Result.ok(undefined);

    const quotaCheck = await this.creditsManager.checkTokenQuota(userId, {
      minTokens,
    });

    if (!quotaCheck.allowed) {
      return Result.err(
        new QuotaExceededError({
          message:
            quotaCheck.message ??
            "You have exhausted your daily AI token quota.",
          resetAt: quotaCheck.resetAt,
        }),
      );
    }

    return Result.ok(undefined);
  }

  private async settleUsage(
    userId: UserId,
    tokens: number,
    metadata: string,
  ): Promise<void> {
    if (!this.creditsManager || tokens <= 0) return;
    try {
      await this.creditsManager.settleTokenUsage(userId, {
        tokensUsed: tokens,
        metadata,
      });
    } catch (error) {
      console.error("AIService.settleUsage error:", error);
    }
  }

  /**
   * Stream interactive document transformations for the BlockNote editor.
   */
  async streamEditorAI(
    input: StreamEditorAIInput,
  ): Promise<
    Result<ReturnType<typeof streamText>, AIError | QuotaExceededError>
  > {
    return Result.gen(async function* (this: AIService) {
      yield* Result.await(this.checkQuota(input.userId));

      try {
        const model = this.googleClient("gemini-3.6-flash");
        const system =
          input.systemPrompt ?? aiDocumentFormats.html.systemPrompt;

        const modelMessages = await convertToModelMessages(
          injectDocumentStateMessages(input.messages),
        );

        const blockNoteTools = toolDefinitionsToToolSet(input.toolDefinitions);

        // Server-side workspace knowledge tool injected into editor AI
        const tools = {
          ...blockNoteTools,
          ...(input.workspaceId && this.searchService
            ? {
                searchWorkspaceKnowledge: tool({
                  description:
                    "Search the workspace knowledge base to retrieve facts, documentation, notes, and context from other pages.",
                  inputSchema: z.object({
                    query: z.string().describe("The semantic search query"),
                  }),
                  execute: async ({ query }: { query: string }) => {
                    const results = await this.searchService!.hybridSearch({
                      workspaceId: input.workspaceId!,
                      query,
                      limit: 5,
                    });
                    if (results.isErr()) {
                      return { error: "Failed to search workspace knowledge" };
                    }
                    return results.value.map((item) => ({
                      pageTitle: item.pageTitle,
                      sectionTitle: item.sectionTitle,
                      content: item.content,
                    }));
                  },
                }),
              }
            : {}),
        };

        const result = streamText({
          model,
          system,
          messages: modelMessages,
          tools,
          toolChoice: "auto",
          onFinish: async ({ usage }) => {
            try {
              const promptTokens = usage.inputTokens ?? 0;
              const completionTokens = usage.outputTokens ?? 0;
              const totalTokens =
                usage.totalTokens ?? promptTokens + completionTokens;

              await this.settleUsage(
                input.userId,
                totalTokens,
                "BlockNote AI Document Streaming",
              );

              if (input.onFinish) {
                await input.onFinish({
                  totalTokens,
                  promptTokens,
                  completionTokens,
                });
              }
            } catch (error) {
              console.error("Error in onFinish AI callback:", error);
            }
          },
        });

        return Result.ok(result);
      } catch (error) {
        console.error("AIService.streamEditorAI error:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to generate AI response";
        const cause = error instanceof Error ? error : undefined;
        return Result.err(
          new AIError({
            message,
            cause,
          }),
        );
      }
    }, this);
  }

  async streamRAG(
    input: StreamRAGInput,
  ): Promise<
    Result<ReturnType<typeof streamText>, AIError | QuotaExceededError>
  > {
    return Result.gen(async function* (this: AIService) {
      yield* Result.await(this.checkQuota(input.userId));

      try {
        const model = this.googleClient("gemini-3.6-flash");

        const modelMessages: ModelMessage[] = input.history.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        }));

        modelMessages.push({
          role: "user",
          content: `${input.contextBlock}\n\nUser Question:\n${input.userPrompt}`,
        });

        const result = streamText({
          model,
          system: STRICT_RAG_SYSTEM_PROMPT,
          messages: modelMessages,
          onFinish: async ({ text: assistantResponse, usage }) => {
            try {
              const promptTokens = usage.inputTokens ?? 0;
              const completionTokens = usage.outputTokens ?? 0;
              const totalTokens =
                usage.totalTokens ?? promptTokens + completionTokens;

              await this.settleUsage(
                input.userId,
                totalTokens,
                "RAG Assistant Chat",
              );

              if (input.onFinish) {
                await input.onFinish(assistantResponse, {
                  totalTokens,
                  promptTokens,
                  completionTokens,
                });
              }
            } catch (error) {
              console.error("Error in onFinish RAG callback:", error);
            }
          },
        });

        return Result.ok(result);
      } catch (error) {
        console.error("AIService.streamRAG error:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to generate assistant response";
        const cause = error instanceof Error ? error : undefined;
        return Result.err(
          new AIError({
            message,
            cause,
          }),
        );
      }
    }, this);
  }

  /**
   * Generate a short 3-4 word summary title for a new conversation thread.
   */
  async generateSummaryTitle(userPrompt: string): Promise<string | null> {
    try {
      const model = this.googleClient("gemini-2.5-flash");
      const titleResult = await generateText({
        model,
        prompt: `Generate a concise 3-4 word title summarizing this question: "${userPrompt}". Return ONLY the title text, without quotes.`,
      });
      const cleanTitle = titleResult.text.trim().replace(/^["']|["']$/g, "");
      return cleanTitle || null;
    } catch (error) {
      console.warn("AIService.generateSummaryTitle non-fatal error:", error);
      return null;
    }
  }
}
