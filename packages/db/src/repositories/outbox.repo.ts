import type { AppDB, DBClient } from "../index";
import { outbox } from "../schema";
import { and, eq, lte, sql } from "drizzle-orm";
import { Result } from "better-result";
import { DatabaseError } from "../errors";
import type {
  OutboxEntry,
  CreateOutboxEntryInput,
} from "@dotion/shared/outbox/types";

export class OutboxRepository {
  constructor(private readonly db: DBClient) {}

  async upsertEntry({
    input,
  }: {
    input: CreateOutboxEntryInput;
  }): Promise<Result<OutboxEntry, DatabaseError>> {
    try {
      const [row] = await this.db
        .insert(outbox)
        .values(input)
        .onConflictDoUpdate({
          target: [outbox.type, outbox.aggregateId],
          set: {
            payload: sql`excluded.payload`,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!row) {
        return Result.err(
          new DatabaseError({ message: "Failed to upsert outbox entry" }),
        );
      }

      return Result.ok(row as OutboxEntry);
    } catch (error) {
      console.error("OutboxRepository.upsertEntry error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to upsert outbox entry" }),
      );
    }
  }

  async upsertEntryTx({
    tx,
    input,
  }: {
    tx: AppDB;
    input: CreateOutboxEntryInput;
  }): Promise<Result<OutboxEntry, DatabaseError>> {
    try {
      const [row] = await tx
        .insert(outbox)
        .values(input)
        .onConflictDoUpdate({
          target: [outbox.type, outbox.aggregateId],
          set: {
            payload: sql`excluded.payload`,
            updatedAt: new Date(),
          },
        })
        .returning();

      if (!row) {
        return Result.err(
          new DatabaseError({ message: "Failed to upsert outbox entry" }),
        );
      }

      return Result.ok(row as OutboxEntry);
    } catch (error) {
      console.error("OutboxRepository.upsertEntryTx error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to upsert outbox entry" }),
      );
    }
  }

  async deleteEntry({
    type,
    aggregateId,
    claimedAt,
  }: {
    type: string;
    aggregateId: string;
    claimedAt?: Date;
  }): Promise<Result<void, DatabaseError>> {
    try {
      const conditions = [
        eq(outbox.type, type),
        eq(outbox.aggregateId, aggregateId),
      ];

      if (claimedAt) {
        conditions.push(lte(outbox.updatedAt, claimedAt));
      }

      await this.db.delete(outbox).where(and(...conditions));
      return Result.ok(undefined);
    } catch (error) {
      console.error("OutboxRepository.deleteEntry error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to delete outbox entry" }),
      );
    }
  }

  async deleteEntryTx({
    tx,
    type,
    aggregateId,
    claimedAt,
  }: {
    tx: AppDB;
    type: string;
    aggregateId: string;
    claimedAt?: Date;
  }): Promise<Result<void, DatabaseError>> {
    try {
      const conditions = [
        eq(outbox.type, type),
        eq(outbox.aggregateId, aggregateId),
      ];

      if (claimedAt) {
        conditions.push(lte(outbox.updatedAt, claimedAt));
      }

      await tx.delete(outbox).where(and(...conditions));
      return Result.ok(undefined);
    } catch (error) {
      console.error("OutboxRepository.deleteEntryTx error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to delete outbox entry" }),
      );
    }
  }

  async getStaleEntries({
    olderThan,
    limit = 50,
    type,
  }: {
    olderThan: Date;
    limit?: number;
    type?: string;
  }): Promise<Result<OutboxEntry[], DatabaseError>> {
    try {
      const conditions = [lte(outbox.updatedAt, olderThan)];
      if (type) {
        conditions.push(eq(outbox.type, type));
      }

      const rows = await this.db
        .select()
        .from(outbox)
        .where(and(...conditions))
        .limit(limit);

      return Result.ok(rows as OutboxEntry[]);
    } catch (error) {
      console.error("OutboxRepository.getStaleEntries error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to fetch stale outbox entries" }),
      );
    }
  }
}
