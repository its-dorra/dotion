import { Result } from "better-result";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, generateText, type ModelMessage } from "ai";
import type {
  AssistantRepository,
  AssistantThreadRecord,
  AssistantMessageRecord,
  PaginatedList,
} from "@dotion/db/repositories";
import type { DBClient } from "@dotion/db";
import type { SearchService } from "./search.service";
import type { UserCreditsManager } from "./realtime.types";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserId } from "@dotion/shared/users/types";
import type { AssistantThreadId } from "@dotion/shared/ids";
import type { AssistantCitation } from "@dotion/shared/assistant/types";
import type { DatabaseError, NotFoundError } from "@dotion/db/errors";
import { AIError, QuotaExceededError } from "./ai.service";

const STRICT_RAG_SYSTEM_PROMPT = `You are Dotion AI, a dedicated and factual workspace assistant. Your sole purpose is to help users understand, find, and synthesize information from their Dotion workspace documents and notes.

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

export interface StreamChatInput {
  threadId: AssistantThreadId;
  workspaceId: WorkspaceId;
  userId: UserId;
  content: string;
}

export class AssistantService {
  private readonly googleClient: ReturnType<
    typeof createGoogleGenerativeAI
  > | null = null;

  constructor(
    private readonly assistantRepository: AssistantRepository,
    private readonly searchService: SearchService,
    private readonly dbClient: DBClient,
    apiKey: string,
    private readonly creditsManager?: UserCreditsManager,
  ) {
    if (apiKey) {
      this.googleClient = createGoogleGenerativeAI({ apiKey });
    }
  }

  async listThreads(
    workspaceId: WorkspaceId,
    userId: UserId,
    pagination: { cursor?: string; limit?: number } = {},
  ): Promise<Result<PaginatedList<AssistantThreadRecord>, DatabaseError>> {
    return this.assistantRepository.listThreads(
      workspaceId,
      userId,
      pagination,
    );
  }

  async getThread(
    threadId: AssistantThreadId,
  ): Promise<Result<AssistantThreadRecord, DatabaseError | NotFoundError>> {
    return this.assistantRepository.getThread(threadId);
  }

  async createThread(
    workspaceId: WorkspaceId,
    userId: UserId,
    title?: string,
  ): Promise<Result<AssistantThreadRecord, DatabaseError>> {
    return this.dbClient.transaction(async (tx) => {
      return this.assistantRepository.createThread(tx, {
        workspaceId,
        userId,
        title,
      });
    });
  }

  async deleteThread(
    threadId: AssistantThreadId,
  ): Promise<Result<void, DatabaseError>> {
    return this.dbClient.transaction(async (tx) => {
      return this.assistantRepository.deleteThread(tx, threadId);
    });
  }

  async listMessages(
    threadId: AssistantThreadId,
    pagination: { cursor?: string; limit?: number } = {},
  ): Promise<Result<PaginatedList<AssistantMessageRecord>, DatabaseError>> {
    return this.assistantRepository.listMessages(threadId, pagination);
  }

  async streamChat(
    input: StreamChatInput,
  ): Promise<
    Result<
      ReturnType<typeof streamText>,
      AIError | QuotaExceededError | DatabaseError | NotFoundError
    >
  > {
    try {
      if (!this.googleClient) {
        return Result.err(
          new AIError({
            message: "AssistantService: GEMINI_API_KEY is missing",
          }),
        );
      }

      // 1. Quota check
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

      // 2. Verify thread exists
      const threadResult = await this.assistantRepository.getThread(
        input.threadId,
      );
      if (threadResult.isErr()) {
        return Result.err(threadResult.error);
      }
      const thread = threadResult.value;

      // 3. Save incoming user message in PostgreSQL
      const userMessageResult = await this.dbClient.transaction(async (tx) => {
        return this.assistantRepository.createMessage(tx, {
          threadId: input.threadId,
          role: "user",
          content: input.content,
        });
      });

      if (userMessageResult.isErr()) {
        return Result.err(userMessageResult.error);
      }

      // 4. Retrieve recent message history (sliding memory window)
      const historyResult = await this.assistantRepository.listMessages(
        input.threadId,
        { limit: 10 },
      );
      const priorMessages = historyResult.isOk()
        ? historyResult.value.items
        : [];

      // 5. Execute Hybrid RAG Search across workspace
      const searchResult = await this.searchService.hybridSearch({
        workspaceId: input.workspaceId,
        query: input.content,
        limit: 5,
      });

      const retrievedSections = searchResult.isOk() ? searchResult.value : [];

      // 6. Build structured Context and Citations map
      const citations: AssistantCitation[] = [];
      let contextBlock = "<workspace_context>\n";

      if (retrievedSections.length === 0) {
        contextBlock += "No matching workspace documents found.\n";
      } else {
        retrievedSections.forEach((section, index) => {
          const sourceId = index + 1;
          citations.push({
            pageId: section.pageId,
            pageTitle: section.pageTitle,
            sectionTitle: section.sectionTitle,
            headingBlockId: section.headingBlockId,
          });

          contextBlock += `[${sourceId}] Document: "${section.pageTitle}" > Section: "${section.sectionTitle}"\n${section.content}\n\n`;
        });
      }
      contextBlock += "</workspace_context>";

      // 7. Construct Model Messages for streamText
      const model = this.googleClient("gemini-2.5-flash");

      const modelMessages: ModelMessage[] = priorMessages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

      // Append latest context + user prompt
      modelMessages.push({
        role: "user",
        content: `${contextBlock}\n\nUser Question:\n${input.content}`,
      });

      // 8. Stream Response
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

            // Save assistant message to PostgreSQL
            await this.dbClient.transaction(async (tx) => {
              await this.assistantRepository.createMessage(tx, {
                threadId: input.threadId,
                role: "assistant",
                content: assistantResponse,
                citations: citations.length > 0 ? citations : undefined,
                tokensUsed: totalTokens,
              });

              // Auto-generate a title if thread is named "New Chat"
              if (thread.title === "New Chat" && this.googleClient) {
                try {
                  const titleResult = await generateText({
                    model: this.googleClient("gemini-2.5-flash"),
                    prompt: `Generate a concise 3-4 word title summarizing this question: "${input.content}". Return ONLY the title text, without quotes.`,
                  });
                  const cleanTitle = titleResult.text
                    .trim()
                    .replace(/^["']|["']$/g, "");
                  if (cleanTitle) {
                    await this.assistantRepository.updateThreadTitle(
                      tx,
                      input.threadId,
                      cleanTitle,
                    );
                  }
                } catch {
                  // Non-fatal
                }
              }
            });

            // Settle tokens in UserCreditsDO
            if (this.creditsManager && totalTokens > 0) {
              await this.creditsManager.settleTokenUsage(input.userId, {
                tokensUsed: totalTokens,
                metadata: "RAG Assistant Chat",
              });
            }
          } catch (error) {
            console.error(
              "Error in AssistantService onFinish callback:",
              error,
            );
          }
        },
      });

      return Result.ok(result);
    } catch (error) {
      console.error("AssistantService.streamChat error:", error);
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
  }
}
