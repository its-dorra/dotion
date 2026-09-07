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
import type { AssistantCitation } from "@dotion/shared/assistant/types";
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
  workspaceId: WorkspaceId;
  history: { role: string; content: string }[];
  userPrompt: string;
  contextBlock?: string;
  onCitationCollected?: (citation: AssistantCitation) => void;
  onFinish?: (
    text: string,
    usage: AIUsageMetrics,
    citations: AssistantCitation[],
  ) => Promise<void> | void;
}

export const STRICT_RAG_SYSTEM_PROMPT = [
  "You are Dotion AI, the workspace knowledge assistant.",
  "Your primary purpose is to help users understand, find, summarize,",
  "and synthesize information contained in their Dotion workspace.",
  "## SCOPE",
  "Answer questions about the user's workspace, including:",
  "- documents and pages",
  "- projects and tasks",
  "- decisions and notes",
  "- workspace architecture and procedures",
  "- information contained in workspace databases",
  "For unrelated general questions, explain that you are Dotion's",
  "workspace assistant and can only help with workspace-related content.",
  "## WORKSPACE GROUNDING",
  "Workspace content is the authoritative source for workspace-specific",
  "facts, decisions, names, procedures, and claims.",
  "When a question requires workspace information, use `searchWorkspace`",
  "before answering.",
  "Never invent workspace-specific information.",
  "You may use general knowledge to explain or clarify information",
  "retrieved from the workspace, but clearly distinguish general",
  "knowledge from information contained in the workspace.",
  "## SEARCH STRATEGY",
  "Use:",
  "- `conceptual` for semantic questions, explanations, summaries,",
  "  and broad questions.",
  "- `exact` for names, identifiers, code symbols, error messages,",
  "  quoted phrases, URLs, table names, and other exact terminology.",
  "- `balanced` when both semantic and lexical matching are important.",
  "For complex or multi-part questions, perform multiple searches when",
  "necessary.",
  "After searching, evaluate whether the retrieved sources actually",
  "answer the question. If they are insufficient, ambiguous, or",
  "irrelevant, refine the query and search again.",
  "Do not confidently answer from weak or unrelated retrieval results.",
  "## EVIDENCE",
  "Every workspace-specific factual claim must be supported by retrieved",
  "workspace content.",
  "Do not:",
  "- fabricate missing information;",
  "- assume something exists because it is common or likely;",
  "- silently resolve conflicting workspace information;",
  "- treat unrelated search results as evidence.",
  "If workspace sources conflict, explicitly describe the conflict and",
  "cite the relevant sources.",
  "If the workspace only partially answers the question, answer the",
  "supported portion and clearly state what cannot be determined.",
  "If no relevant information can be found, say:",
  '"I couldn\'t find this information in your workspace."',
  "## CITATIONS",
  "Use `[N]` citations for workspace-derived claims.",
  "`[N]` must correspond exactly to the `sourceId` returned by",
  "`searchWorkspace`.",
  "Place citations immediately after the claim they support.",
  "Do not invent citation numbers or cite sources that do not support",
  "the claim.",
  "When multiple sources support a claim, cite all relevant sources.",
  "## LANGUAGE",
  "Respond in the primary language of the user's latest message.",
  "Preserve technical identifiers, code, names, and quoted text in their",
  "original form unless translation is requested.",
  "## RESPONSE STYLE",
  "Be concise and useful.",
  "Use Markdown when appropriate.",
  "Do not mention internal tools, embeddings, retrieval algorithms,",
  "search queries, or implementation details unless the user asks about",
  "them.",
].join("\n");

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

        const tools = {
          ...blockNoteTools,
          ...(input.workspaceId && this.searchService
            ? {
                searchWorkspace: this.createWorkspaceSearchTool({
                  workspaceId: input.workspaceId,
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
    Result<ReturnType<typeof streamText<any>>, AIError | QuotaExceededError>
  > {
    return Result.gen(async function* (this: AIService) {
      yield* Result.await(this.checkQuota(input.userId));

      try {
        const model = this.googleClient("gemini-3.6-flash");
        const citations: AssistantCitation[] = [];

        const modelMessages: ModelMessage[] = input.history.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        }));

        const userMessageContent = input.contextBlock
          ? `${input.contextBlock}\n\nUser Question:\n${input.userPrompt}`
          : input.userPrompt;

        modelMessages.push({
          role: "user",
          content: userMessageContent,
        });

        const tools = {
          searchWorkspace: this.createWorkspaceSearchTool({
            workspaceId: input.workspaceId,
            citations,
            onCitationCollected: input.onCitationCollected,
          }),
        };

        const result = streamText({
          model,
          system: STRICT_RAG_SYSTEM_PROMPT,
          messages: modelMessages,
          tools,
          toolChoice: "auto",
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
                await input.onFinish(
                  assistantResponse,
                  {
                    totalTokens,
                    promptTokens,
                    completionTokens,
                  },
                  citations,
                );
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

  private createWorkspaceSearchTool(options: {
    workspaceId: WorkspaceId;
    citations?: AssistantCitation[];
    onCitationCollected?: (citation: AssistantCitation) => void;
  }) {
    return tool({
      description:
        "Search the workspace knowledge base across all pages. Specify 'query' and 'mode' ('conceptual' for explanations, summaries, and broad questions in any language; 'exact' for specific code identifiers, table names, error codes, or quoted phrases; 'balanced' for general lookups).",
      inputSchema: z.object({
        query: z.string().describe("The search query to look up"),
        limit: z
          .number()
          .min(1)
          .max(15)
          .optional()
          .describe("Number of relevant sections to retrieve (default: 5)"),
        mode: z
          .enum(["conceptual", "exact", "balanced"])
          .default("conceptual")
          .optional()
          .describe(
            "Search mode: 'conceptual' (default, optimal for explanations in any language), 'exact' (for code/IDs), or 'balanced'",
          ),
      }),
      execute: async ({ query, limit, mode }) => {
        const searchSvc = this.searchService;
        if (!searchSvc) {
          return { error: "Workspace search is not available." };
        }

        const results = await searchSvc.hybridSearch({
          workspaceId: options.workspaceId,
          query,
          limit: limit ?? 5,
          mode: mode ?? "conceptual",
        });

        if (results.isErr()) {
          return { error: "Failed to search workspace knowledge." };
        }

        const items = results.value.payload;
        if (options.citations) {
          items.forEach((item) => {
            const citation: AssistantCitation = {
              pageId: item.pageId,
              pageTitle: item.pageTitle,
              sectionTitle: item.sectionTitle,
              headingBlockId: item.headingBlockId,
            };
            options.citations!.push(citation);
            options.onCitationCollected?.(citation);
          });
        }

        return items.map((item, index) => ({
          sourceId: options.citations
            ? options.citations.length - items.length + index + 1
            : index + 1,
          pageTitle: item.pageTitle,
          sectionTitle: item.sectionTitle,
          content: item.content,
        }));
      },
    });
  }

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
