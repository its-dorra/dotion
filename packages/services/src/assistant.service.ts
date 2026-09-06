import { Result } from "better-result";
import type { streamText } from "ai";
import type {
  AssistantRepository,
  AssistantThreadRecord,
  AssistantMessageRecord,
  PaginatedList,
} from "@dotion/db/repositories";
import type { DBClient } from "@dotion/db";
import type { SearchService } from "./search.service";
import type { AIService, AIError, QuotaExceededError } from "./ai.service";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserId } from "@dotion/shared/users/types";
import type { AssistantThreadId } from "@dotion/shared/ids";
import type { AssistantCitation } from "@dotion/shared/assistant/types";
import type { DatabaseError, NotFoundError } from "@dotion/db/errors";

export interface StreamChatInput {
  threadId: AssistantThreadId;
  workspaceId: WorkspaceId;
  userId: UserId;
  content: string;
}

export class AssistantService {
  constructor(
    private readonly assistantRepository: AssistantRepository,
    private readonly searchService: SearchService,
    private readonly aiService: AIService,
    private readonly dbClient: DBClient,
  ) {}

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
    return this.assistantRepository.createThread(this.dbClient, {
      workspaceId,
      userId,
      title,
    });
  }

  async deleteThread(
    threadId: AssistantThreadId,
  ): Promise<Result<void, DatabaseError>> {
    return this.assistantRepository.deleteThread(this.dbClient, threadId);
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
    return Result.gen(async function* (this: AssistantService) {
      // 1. Verify thread exists
      const thread = yield* Result.await(
        this.assistantRepository.getThread(input.threadId),
      );

      // 2. Persist incoming user message
      yield* Result.await(
        this.assistantRepository.createMessage(this.dbClient, {
          threadId: input.threadId,
          role: "user",
          content: input.content,
        }),
      );

      // 3. Fetch prior conversation history (sliding context memory)
      const priorMessages = yield* Result.await(
        this.assistantRepository
          .listMessages(input.threadId, { limit: 10 })
          .then(
            Result.match({
              ok: (list) => Result.ok(list.items),
              err: () => Result.ok([]),
            }),
          ),
      );

      // 4. Retrieve relevant workspace knowledge via Hybrid Search
      const retrievedSections = yield* Result.await(
        this.searchService
          .hybridSearch({
            workspaceId: input.workspaceId,
            query: input.content,
            limit: 5,
          })
          .then(
            Result.match({
              ok: (sections) => Result.ok(sections),
              err: () => Result.ok([]),
            }),
          ),
      );

      // 5. Build structured Context and Citations map
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

      // 6. Delegate LLM stream execution to unified AIService
      return this.aiService.streamRAG({
        userId: input.userId,
        history: priorMessages,
        contextBlock,
        userPrompt: input.content,
        onFinish: async (assistantResponse, usage) => {
          try {
            // Save assistant message to PostgreSQL
            await this.assistantRepository.createMessage(this.dbClient, {
              threadId: input.threadId,
              role: "assistant",
              content: assistantResponse,
              citations: citations.length > 0 ? citations : undefined,
              tokensUsed: usage.totalTokens,
            });

            // Auto-generate title if thread is named "New Chat"
            if (thread.title === "New Chat") {
              const summaryTitle = await this.aiService.generateSummaryTitle(
                input.content,
              );
              if (summaryTitle) {
                await this.assistantRepository.updateThreadTitle(
                  this.dbClient,
                  input.threadId,
                  summaryTitle,
                );
              }
            }
          } catch (error) {
            console.error(
              "AssistantService.streamChat onFinish persistence error:",
              error,
            );
          }
        },
      });
    }, this);
  }
}
