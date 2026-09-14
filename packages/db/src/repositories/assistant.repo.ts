import type { DBClient } from "../index";
import { assistantThreads, assistantMessages } from "../schema";
import { and, desc, eq, lt } from "drizzle-orm";
import { Result } from "better-result";
import { DatabaseError, NotFoundError } from "../errors";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserId } from "@dotion/shared/users/types";
import type { AssistantThreadId } from "@dotion/shared/ids";
import type {
  AssistantThread,
  AssistantMessage,
  AssistantCitation,
  ToolPart,
  PaginatedThreadsResponse,
  PaginatedMessagesResponse,
} from "@dotion/shared/assistant/types";

export type AssistantThreadRecord = AssistantThread;
export type AssistantMessageRecord = AssistantMessage;

export class AssistantRepository {
  constructor(private readonly db: DBClient) {}

  async listThreads({
    workspaceId,
    userId,
    pagination = {},
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
    pagination?: { cursor?: string; limit?: number };
  }): Promise<Result<PaginatedThreadsResponse, DatabaseError>> {
    try {
      const limit = Math.min(pagination.limit ?? 20, 50);
      const cursorDate = pagination.cursor
        ? new Date(pagination.cursor)
        : undefined;

      const whereClause = cursorDate
        ? and(
            eq(assistantThreads.workspaceId, workspaceId),
            eq(assistantThreads.userId, userId),
            lt(assistantThreads.updatedAt, cursorDate),
          )
        : and(
            eq(assistantThreads.workspaceId, workspaceId),
            eq(assistantThreads.userId, userId),
          );

      const rows = await this.db
        .select()
        .from(assistantThreads)
        .where(whereClause)
        .orderBy(desc(assistantThreads.updatedAt))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = (
        hasMore ? rows.slice(0, limit) : rows
      ) as AssistantThread[];
      const lastItem = items[items.length - 1];
      const nextCursor =
        hasMore && lastItem ? lastItem.updatedAt.toISOString() : null;

      return Result.ok({
        items,
        nextCursor,
        hasMore,
      });
    } catch (error) {
      console.error("AssistantRepository.listThreads error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to list assistant threads" }),
      );
    }
  }

  async getThread({
    threadId,
  }: {
    threadId: AssistantThreadId;
  }): Promise<Result<AssistantThread, DatabaseError | NotFoundError>> {
    try {
      const [row] = await this.db
        .select()
        .from(assistantThreads)
        .where(eq(assistantThreads.id, threadId))
        .limit(1);

      if (!row) {
        return Result.err(
          new NotFoundError({ message: "Assistant thread not found" }),
        );
      }

      return Result.ok(row as AssistantThread);
    } catch (error) {
      console.error("AssistantRepository.getThread error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to get assistant thread" }),
      );
    }
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
    try {
      const [row] = await this.db
        .insert(assistantThreads)
        .values({
          workspaceId,
          userId,
          title: title ?? "New Chat",
        })
        .returning();

      if (!row) {
        return Result.err(
          new DatabaseError({ message: "Failed to create assistant thread" }),
        );
      }

      return Result.ok(row as AssistantThread);
    } catch (error) {
      console.error("AssistantRepository.createThread error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to create assistant thread" }),
      );
    }
  }

  async updateThreadTitle({
    threadId,
    title,
  }: {
    threadId: AssistantThreadId;
    title: string;
  }): Promise<Result<AssistantThread, DatabaseError | NotFoundError>> {
    try {
      const [row] = await this.db
        .update(assistantThreads)
        .set({ title, updatedAt: new Date() })
        .where(eq(assistantThreads.id, threadId))
        .returning();

      if (!row) {
        return Result.err(
          new NotFoundError({ message: "Assistant thread not found" }),
        );
      }

      return Result.ok(row as AssistantThread);
    } catch (error) {
      console.error("AssistantRepository.updateThreadTitle error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to update assistant thread" }),
      );
    }
  }

  async deleteThread({
    threadId,
  }: {
    threadId: AssistantThreadId;
  }): Promise<Result<void, DatabaseError>> {
    try {
      await this.db
        .delete(assistantThreads)
        .where(eq(assistantThreads.id, threadId));
      return Result.ok(undefined);
    } catch (error) {
      console.error("AssistantRepository.deleteThread error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to delete assistant thread" }),
      );
    }
  }

  async listMessages({
    threadId,
    pagination = {},
  }: {
    threadId: AssistantThreadId;
    pagination?: { cursor?: string; limit?: number };
  }): Promise<Result<PaginatedMessagesResponse, DatabaseError>> {
    try {
      const limit = Math.min(pagination.limit ?? 30, 100);
      const cursorDate = pagination.cursor
        ? new Date(pagination.cursor)
        : undefined;

      const whereClause = cursorDate
        ? and(
            eq(assistantMessages.threadId, threadId),
            lt(assistantMessages.createdAt, cursorDate),
          )
        : eq(assistantMessages.threadId, threadId);

      const rows = await this.db
        .select()
        .from(assistantMessages)
        .where(whereClause)
        .orderBy(desc(assistantMessages.createdAt))
        .limit(limit + 1);

      const hasMore = rows.length > limit;
      const items = (
        hasMore ? rows.slice(0, limit) : rows
      ) as AssistantMessage[];
      const lastItem = items[items.length - 1];
      const nextCursor =
        hasMore && lastItem ? lastItem.createdAt.toISOString() : null;

      return Result.ok({
        items,
        nextCursor,
        hasMore,
      });
    } catch (error) {
      console.error("AssistantRepository.listMessages error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to list assistant messages" }),
      );
    }
  }

  async createMessage({
    threadId,
    role,
    content,
    citations,
    toolCalls,
    tokensUsed,
  }: {
    threadId: AssistantThreadId;
    role: "user" | "assistant" | "system";
    content: string;
    citations?: AssistantCitation[];
    toolCalls?: ToolPart[];
    tokensUsed?: number;
  }): Promise<Result<AssistantMessage, DatabaseError>> {
    try {
      const [row] = await this.db
        .insert(assistantMessages)
        .values({
          threadId,
          role,
          content,
          citations: citations ?? null,
          toolCalls: toolCalls ?? null,
          tokensUsed: tokensUsed ?? 0,
        })
        .returning();

      if (!row) {
        return Result.err(
          new DatabaseError({ message: "Failed to create assistant message" }),
        );
      }

      await this.db
        .update(assistantThreads)
        .set({ updatedAt: new Date() })
        .where(eq(assistantThreads.id, threadId));

      return Result.ok(row as AssistantMessage);
    } catch (error) {
      console.error("AssistantRepository.createMessage error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to create assistant message" }),
      );
    }
  }
}
