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
    _searchService: SearchService,
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
      const thread = yield* Result.await(
        this.assistantRepository.getThread(input.threadId),
      );

      yield* Result.await(
        this.assistantRepository.createMessage(this.dbClient, {
          threadId: input.threadId,
          role: "user",
          content: input.content,
        }),
      );

      const priorMessages = await this.assistantRepository
        .listMessages(input.threadId, { limit: 10 })
        .then((res) => (res.isOk() ? res.value.items : []));

      return this.aiService.streamRAG({
        userId: input.userId,
        workspaceId: input.workspaceId,
        history: priorMessages,
        userPrompt: input.content,
        onFinish: async (assistantResponse, usage, citations) => {
          try {
            await this.assistantRepository.createMessage(this.dbClient, {
              threadId: input.threadId,
              role: "assistant",
              content: assistantResponse,
              citations: citations.length > 0 ? citations : undefined,
              tokensUsed: usage.totalTokens,
            });

            if (
              !thread.title ||
              thread.title === "New Chat" ||
              thread.title.trim() === ""
            ) {
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
