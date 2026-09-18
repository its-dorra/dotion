import { Result } from "better-result";
import { groq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import {
  streamText,
  generateText,
  convertToModelMessages,
  isStepCount,
  type ToolSet,
} from "ai";
import {
  aiDocumentFormats,
  injectDocumentStateMessages,
  toolDefinitionsToToolSet,
} from "@blocknote/xl-ai/server";
import type { UserId } from "@dotion/shared/users/types";
import type {
  AssistantCitation,
  ToolPart,
} from "@dotion/shared/assistant/types";
import { createWorkspaceTools } from "./workspace-tools.factory";
import type { UserCreditsManager } from "./realtime.types";
import type { SearchService } from "./search.service";
import type { PagesService } from "./pages.service";
import type { ChunkingService } from "./chunking.service";
import { createFallback } from "ai-fallback";
import { AIError, QuotaExceededError } from "@dotion/shared/ai/errors";
import {
  PRIMARY_RAG_MODEL,
  SECONDARY_RAG_MODEL,
  PRIMARY_SUMMARY_MODEL,
  SECONDARY_SUMMARY_MODEL,
  STRICT_RAG_SYSTEM_PROMPT,
} from "@dotion/shared/ai/constants";
import {
  type WorkspaceToolResult,
  type BlockNoteToolDefinitions,
  type StreamEditorAIInput,
  type StreamRAGInput,
  type AIUsageMetrics,
} from "@dotion/shared/ai/types";
export type {
  AIError,
  QuotaExceededError,
  WorkspaceToolResult,
  BlockNoteToolDefinitions,
  StreamEditorAIInput,
  StreamRAGInput,
  AIUsageMetrics,
};

function extractToolPartsFromSteps(
  steps?: Array<{
    toolResults: Array<{
      toolName: string;
      toolCallId: string;
      input: unknown;
      output: unknown;
    }>;
  }>,
): ToolPart[] {
  if (!steps) return [];
  return steps.flatMap((step) =>
    step.toolResults.map(
      (tr): ToolPart =>
        ({
          type: `tool-${tr.toolName}` as ToolPart["type"],
          toolCallId: tr.toolCallId,
          state: "output-available",
          input: tr.input as Record<string, unknown>,
          output: tr.output,
        }) as ToolPart,
    ),
  );
}

export class AIService {
  private readonly ragModel: ReturnType<typeof createFallback>;

  constructor(
    private readonly creditsManager: UserCreditsManager,
    private readonly searchService: SearchService,
    private readonly pagesService: PagesService,
    private readonly chunkingService: ChunkingService,
  ) {
    this.ragModel = createFallback({
      models: [google(PRIMARY_RAG_MODEL), groq(SECONDARY_RAG_MODEL)],
      onError: (error, modelId) => {
        console.error(`Error with model ${modelId}:`, error);
      },
      modelResetInterval: 60000,
    });
  }

  private async checkQuota(
    userId: UserId,
    minTokens = 50,
  ): Promise<Result<void, QuotaExceededError>> {
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
    if (tokens <= 0) return;
    try {
      await this.creditsManager.settleTokenUsage(userId, {
        tokensUsed: tokens,
        metadata,
      });
    } catch (error) {
      console.error("AIService.settleUsage error:", error);
    }
  }

  async streamEditorAI(
    input: StreamEditorAIInput,
  ): Promise<
    Result<ReturnType<typeof streamText>, AIError | QuotaExceededError>
  > {
    return Result.gen(async function* (this: AIService) {
      yield* Result.await(this.checkQuota(input.userId));

      try {
        const model = this.ragModel;
        const system = aiDocumentFormats.html.systemPrompt;
        const modelMessages = await convertToModelMessages(
          injectDocumentStateMessages(
            input.messages as Parameters<typeof injectDocumentStateMessages>[0],
          ) as Parameters<typeof convertToModelMessages>[0],
        );

        const tools = toolDefinitionsToToolSet(
          input.toolDefinitions,
        ) as ToolSet;

        const result = streamText({
          model,
          temperature: 0.7,
          instructions: system,
          messages: modelMessages,
          tools,
          toolChoice: "required",
          stopWhen: isStepCount(4),
          maxRetries: 3,
          onError: ({ error }) => {
            console.error("AIService.streamEditorAI streamText error:", error);
          },
          onFinish: ({ usage }) => {
            const finishTask = (async () => {
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
              } catch (error) {
                console.error("Error in onFinish AI callback:", error);
              }
            })();

            if (input.onBackgroundWork) {
              input.onBackgroundWork(finishTask);
            }

            return finishTask;
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
    Result<ReturnType<typeof streamText<ToolSet>>, AIError | QuotaExceededError>
  > {
    return Result.gen(async function* (this: AIService) {
      yield* Result.await(this.checkQuota(input.userId));

      try {
        const citations: AssistantCitation[] = [];

        const tools = createWorkspaceTools({
          searchService: this.searchService,
          pagesService: this.pagesService,
          chunkingService: this.chunkingService,
          workspaceId: input.workspaceId,
          citations,
          onCitationCollected: input.onCitationCollected,
          maxSteps: input.maxSteps ?? 10,
        }) as ToolSet;

        const instructions = input.workspaceName
          ? `Current workspace: "${input.workspaceName}".\n\n${STRICT_RAG_SYSTEM_PROMPT}`
          : STRICT_RAG_SYSTEM_PROMPT;

        const result = streamText({
          model: this.ragModel,
          temperature: 0.2,
          instructions,
          messages: input.messages,
          tools,
          toolChoice: "auto",
          stopWhen: isStepCount(input.maxSteps ?? 10),
          maxRetries: 3,
          onError: ({ error }) => {
            console.error("AIService.streamRAG streamText error:", error);
          },
          onFinish: ({ text: assistantResponse, usage, steps }) => {
            const finishTask = (async () => {
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

                const toolParts = extractToolPartsFromSteps(steps);

                if (input.onFinish) {
                  await input.onFinish(
                    assistantResponse,
                    {
                      totalTokens,
                      promptTokens,
                      completionTokens,
                    },
                    citations,
                    toolParts,
                  );
                }
              } catch (error) {
                console.error("Error in onFinish RAG callback:", error);
              }
            })();

            if (input.onBackgroundWork) {
              input.onBackgroundWork(finishTask);
            }

            return finishTask;
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

  async generateSummaryTitle({
    userPrompt,
  }: {
    userPrompt: string;
  }): Promise<Result<string | null, AIError>> {
    return Result.gen(async function* (this: AIService) {
      const summaryModel = createFallback({
        models: [google(PRIMARY_SUMMARY_MODEL), groq(SECONDARY_SUMMARY_MODEL)],
        onError: (error, modelId) => {
          console.error(`Error with summary model ${modelId}:`, error);
        },
        modelResetInterval: 60000,
      });

      const titleRes = yield* Result.await(
        Result.tryPromise({
          try: () =>
            generateText({
              model: summaryModel,
              prompt: `Generate a concise 3-4 word title summarizing this question: "${userPrompt}". Return ONLY the title text, without quotes.`,
              maxRetries: 3,
            }),
          catch: (error) =>
            new AIError({
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to generate summary title",
              cause: error instanceof Error ? error : undefined,
            }),
        }),
      );

      const cleanTitle = titleRes.text.trim().replace(/^["']|["']$/g, "");
      return Result.ok(cleanTitle || null);
    }, this).then((res) => {
      if (res.isErr()) {
        console.warn(
          "AIService.generateSummaryTitle non-fatal error:",
          res.error,
        );
        return Result.ok(null);
      }
      return res;
    });
  }

  async summarizeConversation(
    messages: Array<{ role: string; content: string }>,
  ): Promise<Result<string | null, AIError>> {
    if (messages.length === 0) return Result.ok(null);

    return Result.gen(async function* (this: AIService) {
      const summaryModel = createFallback({
        models: [google(PRIMARY_SUMMARY_MODEL), groq(SECONDARY_SUMMARY_MODEL)],
        onError: (error, modelId) => {
          console.error(`Error with summary model ${modelId}:`, error);
        },
        modelResetInterval: 60000,
      });

      const formatted = messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 300)}`)
        .join("\n");

      const summaryRes = yield* Result.await(
        Result.tryPromise({
          try: () =>
            generateText({
              model: summaryModel,
              prompt: `Summarize the key facts, decisions, and context established in this conversation in 2-3 concise sentences for context memory:\n\n${formatted}\n\nSummary:`,
              maxRetries: 2,
            }),
          catch: (error) =>
            new AIError({
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to summarize conversation",
              cause: error instanceof Error ? error : undefined,
            }),
        }),
      );

      return Result.ok(summaryRes.text.trim() || null);
    }, this).then((res) => {
      if (res.isErr()) {
        console.warn(
          "AIService.summarizeConversation non-fatal error:",
          res.error,
        );
        return Result.ok(null);
      }
      return res;
    });
  }
}
