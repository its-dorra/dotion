import { Result, TaggedError } from "better-result";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages, tool, type UIMessage } from "ai";
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

export class AIService {
  private readonly googleClient: ReturnType<
    typeof createGoogleGenerativeAI
  > | null = null;

  constructor(
    apiKey: string,
    private readonly creditsManager?: UserCreditsManager,
    private readonly searchService?: SearchService,
  ) {
    if (apiKey) {
      this.googleClient = createGoogleGenerativeAI({ apiKey });
    }
  }

  async streamEditorAI(
    input: StreamEditorAIInput,
  ): Promise<
    Result<ReturnType<typeof streamText>, AIError | QuotaExceededError>
  > {
    try {
      if (!this.googleClient) {
        return Result.err(
          new AIError({
            message:
              "AI Service is not configured. GEMINI_API_KEY is missing from environment variables.",
          }),
        );
      }

      if (this.creditsManager) {
        const quotaCheck = await this.creditsManager.checkTokenQuota(
          input.userId,
          { minTokens: 50 },
        );
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
      }

      const model = this.googleClient("gemini-2.5-flash");
      const system = input.systemPrompt ?? aiDocumentFormats.html.systemPrompt;

      const modelMessages = await convertToModelMessages(
        injectDocumentStateMessages(input.messages),
      );

      const blockNoteTools = toolDefinitionsToToolSet(input.toolDefinitions);

      // Server-side knowledge tool injected into editor AI
      const tools = {
        ...blockNoteTools,
        ...(input.workspaceId && this.searchService
          ? {
              searchWorkspaceKnowledge: tool({
                description:
                  "Search the workspace knowledge base to retrieve facts, documentation, meeting notes, and context from other pages.",
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

            if (this.creditsManager && totalTokens > 0) {
              await this.creditsManager.settleTokenUsage(input.userId, {
                tokensUsed: totalTokens,
                metadata: "BlockNote AI Document Streaming",
              });
            }

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
  }
}
