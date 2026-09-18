import { Result } from "better-result";
import {
  type streamText,
  convertToModelMessages,
  isTextUIPart,
  type ModelMessage,
} from "ai";
import type { AssistantRepository } from "@dotion/db/repositories";
import type {
  AssistantThread,
  PaginatedThreadsResponse,
  PaginatedMessagesResponse,
} from "@dotion/shared/assistant/types";
import type { DBClient } from "@dotion/db";
import type { AIService, AIError, QuotaExceededError } from "./ai.service";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserId } from "@dotion/shared/users/types";
import type { AssistantThreadId } from "@dotion/shared/ids";
import type { DatabaseError, NotFoundError } from "@dotion/db/errors";

import type { WorkspacesService } from "./workspaces.service";
import type { StreamChatInput } from "@dotion/shared/assistant/types";
export type { StreamChatInput };

export class AssistantService {
  constructor(
    private readonly assistantRepository: AssistantRepository,
    private readonly aiService: AIService,
    _dbClient: DBClient,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async listThreads({
    workspaceId,
    userId,
    pagination = {},
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
    pagination?: { cursor?: string; limit?: number };
  }): Promise<Result<PaginatedThreadsResponse, DatabaseError>> {
    return this.assistantRepository.listThreads({
      workspaceId,
      userId,
      pagination,
    });
  }

  async getThread({
    threadId,
  }: {
    threadId: AssistantThreadId;
  }): Promise<Result<AssistantThread, DatabaseError | NotFoundError>> {
    return this.assistantRepository.getThread({ threadId });
  }

  async createThread({
    workspaceId,
    userId,
    title,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
    title?: string;
  }): Promise<Result<AssistantThread, DatabaseError>> {
    return this.assistantRepository.createThread({
      workspaceId,
      userId,
      title: title?.trim() || "",
    });
  }

  async deleteThread({
    threadId,
  }: {
    threadId: AssistantThreadId;
  }): Promise<Result<void, DatabaseError>> {
    return this.assistantRepository.deleteThread({ threadId });
  }

  async listMessages({
    threadId,
    pagination = {},
  }: {
    threadId: AssistantThreadId;
    pagination?: { cursor?: string; limit?: number };
  }): Promise<Result<PaginatedMessagesResponse, DatabaseError>> {
    return this.assistantRepository.listMessages({ threadId, pagination });
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
        this.assistantRepository.getThread({ threadId: input.threadId }),
      );

      const priorMessagesResult = await this.assistantRepository.listMessages({
        threadId: input.threadId,
        pagination: { limit: 14 },
      });
      const priorMessages = priorMessagesResult.isOk()
        ? [...priorMessagesResult.value.items].reverse()
        : [];

      let priorModelMessages: ModelMessage[] = [];

      if (priorMessages.length >= 8) {
        const older = priorMessages.slice(0, priorMessages.length - 4);
        const recent = priorMessages.slice(priorMessages.length - 4);
        const summary = yield* Result.await(
          this.aiService.summarizeConversation(
            older.map((m) => ({ role: m.role, content: m.content })),
          ),
        );

        if (summary) {
          priorModelMessages.push({
            role: "user",
            content: `[Summary of earlier conversation: ${summary}]`,
          });
          priorModelMessages.push({
            role: "assistant",
            content:
              "Understood. I will use this background context while answering.",
          });
        } else {
          priorModelMessages.push(
            ...older.map((msg) => ({
              role: (msg.role === "assistant" ? "assistant" : "user") as
                | "assistant"
                | "user",
              content: msg.content,
            })),
          );
        }

        priorModelMessages.push(
          ...recent.map((msg) => ({
            role: (msg.role === "assistant" ? "assistant" : "user") as
              | "assistant"
              | "user",
            content: msg.content,
          })),
        );
      } else {
        priorModelMessages = priorMessages.map((msg) => ({
          role: (msg.role === "assistant" ? "assistant" : "user") as
            | "assistant"
            | "user",
          content: msg.content,
        }));
      }

      const incomingModelMessages = await convertToModelMessages(
        input.messages,
      );
      const allMessages: ModelMessage[] = [
        ...priorModelMessages,
        ...incomingModelMessages,
      ];

      const lastUserUIMessage = [...input.messages]
        .reverse()
        .find((m) => m.role === "user");
      const userPrompt = lastUserUIMessage
        ? lastUserUIMessage.parts
            .filter(isTextUIPart)
            .map((p) => p.text)
            .join("\n")
        : "";

      yield* Result.await(
        this.assistantRepository.createMessage({
          threadId: input.threadId,
          role: "user",
          content: userPrompt,
        }),
      );

      let workspaceName = input.workspaceName;
      if (!workspaceName) {
        const wsResult = await this.workspacesService.getWorkspaceById({
          workspaceId: input.workspaceId,
          userId: input.userId,
        });
        if (wsResult.isOk()) {
          workspaceName = wsResult.value.name;
        }
      }

      return this.aiService.streamRAG({
        userId: input.userId,
        workspaceId: input.workspaceId,
        workspaceName,
        messages: allMessages,
        onFinish: (assistantResponse, usage, citations, toolCalls) => {
          const finishWork = (async () => {
            try {
              await this.assistantRepository.createMessage({
                threadId: input.threadId,
                role: "assistant",
                content: assistantResponse,
                citations: citations.length > 0 ? citations : undefined,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
                tokensUsed: usage.totalTokens,
              });

              if (!thread.title) {
                const titleResult = await this.aiService.generateSummaryTitle({
                  userPrompt,
                });
                if (titleResult.isOk() && titleResult.value) {
                  await this.assistantRepository.updateThreadTitle({
                    threadId: input.threadId,
                    title: titleResult.value,
                  });
                }
              }
            } catch (error) {
              console.error(
                "AssistantService.streamChat onFinish persistence error:",
                error,
              );
            }
          })();

          if (input.onBackgroundWork) {
            input.onBackgroundWork(finishWork);
          }
          return finishWork;
        },
      });
    }, this);
  }
}
