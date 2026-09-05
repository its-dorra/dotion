import type { AppDB, DBClient } from "../index";
import {
  assistantThreads,
  assistantMessages,
  type AssistantCitation,
} from "../schema";
import { and, desc, eq, lt } from "drizzle-orm";
import { Result } from "better-result";
import { DatabaseError, NotFoundError } from "../errors";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserId } from "@dotion/shared/users/types";
import type { AssistantThreadId, AssistantMessageId } from "@dotion/shared/ids";

export interface AssistantThreadRecord {
  id: AssistantThreadId;
  workspaceId: WorkspaceId;
  userId: UserId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssistantMessageRecord {
  id: AssistantMessageId;
  threadId: AssistantThreadId;
  role: "user" | "assistant" | "system";
  content: string;
  citations: AssistantCitation[] | null;
  tokensUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedList<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export class AssistantRepository {
  constructor(private readonly db: DBClient) {}

  async listThreads(
    workspaceId: WorkspaceId,
    userId: UserId,
    pagination: { cursor?: string; limit?: number } = {},
  ): Promise<Result<PaginatedList<AssistantThreadRecord>, DatabaseError>> {
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
      ) as AssistantThreadRecord[];
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

  async getThread(
    threadId: AssistantThreadId,
  ): Promise<Result<AssistantThreadRecord, DatabaseError | NotFoundError>> {
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

      return Result.ok(row as AssistantThreadRecord);
    } catch (error) {
      console.error("AssistantRepository.getThread error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to get assistant thread" }),
      );
    }
  }

  async createThread(
    tx: AppDB,
    input: {
      workspaceId: WorkspaceId;
      userId: UserId;
      title?: string;
    },
  ): Promise<Result<AssistantThreadRecord, DatabaseError>> {
    try {
      const [row] = await tx
        .insert(assistantThreads)
        .values({
          workspaceId: input.workspaceId,
          userId: input.userId,
          title: input.title ?? "New Chat",
        })
        .returning();

      if (!row) {
        return Result.err(
          new DatabaseError({ message: "Failed to create assistant thread" }),
        );
      }

      return Result.ok(row as AssistantThreadRecord);
    } catch (error) {
      console.error("AssistantRepository.createThread error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to create assistant thread" }),
      );
    }
  }

  async updateThreadTitle(
    tx: AppDB,
    threadId: AssistantThreadId,
    title: string,
  ): Promise<Result<AssistantThreadRecord, DatabaseError | NotFoundError>> {
    try {
      const [row] = await tx
        .update(assistantThreads)
        .set({ title, updatedAt: new Date() })
        .where(eq(assistantThreads.id, threadId))
        .returning();

      if (!row) {
        return Result.err(
          new NotFoundError({ message: "Assistant thread not found" }),
        );
      }

      return Result.ok(row as AssistantThreadRecord);
    } catch (error) {
      console.error("AssistantRepository.updateThreadTitle error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to update assistant thread" }),
      );
    }
  }

  async touchThread(
    tx: AppDB,
    threadId: AssistantThreadId,
  ): Promise<Result<void, DatabaseError>> {
    try {
      await tx
        .update(assistantThreads)
        .set({ updatedAt: new Date() })
        .where(eq(assistantThreads.id, threadId));

      return Result.ok(undefined);
    } catch (error) {
      console.error("AssistantRepository.touchThread error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to update thread timestamp" }),
      );
    }
  }

  async deleteThread(
    tx: AppDB,
    threadId: AssistantThreadId,
  ): Promise<Result<void, DatabaseError>> {
    try {
      await tx
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

  async listMessages(
    threadId: AssistantThreadId,
    pagination: { cursor?: string; limit?: number } = {},
  ): Promise<Result<PaginatedList<AssistantMessageRecord>, DatabaseError>> {
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
      const rawItems = (
        hasMore ? rows.slice(0, limit) : rows
      ) as AssistantMessageRecord[];
      const lastRaw = rawItems[rawItems.length - 1];
      const nextCursor =
        hasMore && lastRaw ? lastRaw.createdAt.toISOString() : null;

      // Reverse so items are in chronological ascending order for UI rendering
      const items = [...rawItems].reverse();

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

  async createMessage(
    tx: AppDB,
    input: {
      threadId: AssistantThreadId;
      role: "user" | "assistant" | "system";
      content: string;
      citations?: AssistantCitation[];
      tokensUsed?: number;
    },
  ): Promise<Result<AssistantMessageRecord, DatabaseError>> {
    try {
      const [row] = await tx
        .insert(assistantMessages)
        .values({
          threadId: input.threadId,
          role: input.role,
          content: input.content,
          citations: input.citations ?? null,
          tokensUsed: input.tokensUsed ?? 0,
        })
        .returning();

      if (!row) {
        return Result.err(
          new DatabaseError({ message: "Failed to create assistant message" }),
        );
      }

      // Update parent thread updatedAt
      await tx
        .update(assistantThreads)
        .set({ updatedAt: new Date() })
        .where(eq(assistantThreads.id, input.threadId));

      return Result.ok(row as AssistantMessageRecord);
    } catch (error) {
      console.error("AssistantRepository.createMessage error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to create assistant message" }),
      );
    }
  }
}
