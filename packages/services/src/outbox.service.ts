import { Result } from "better-result";
import type { OutboxRepository } from "@dotion/db/repositories";
import type { AppDB, DBClient } from "@dotion/db";
import type {
  OutboxEntry,
  CreateOutboxEntryInput,
  DomainEvent,
} from "@dotion/shared/outbox/types";
import type { DatabaseError } from "@dotion/db/errors";

export class OutboxService {
  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly dbClient: DBClient,
  ) {}

  async emitEventTx(
    tx: AppDB,
    event: DomainEvent,
  ): Promise<Result<OutboxEntry, DatabaseError>> {
    return this.outboxRepository.upsertEntry(tx, {
      type: event.type,
      aggregateId: event.aggregateId,
      payload: event.payload as Record<string, unknown>,
    });
  }

  async emitEvent(
    event: DomainEvent,
  ): Promise<Result<OutboxEntry, DatabaseError>> {
    return this.outboxRepository.upsertEntry(this.dbClient, {
      type: event.type,
      aggregateId: event.aggregateId,
      payload: event.payload as Record<string, unknown>,
    });
  }

  async upsertEntryTx(
    tx: AppDB,
    input: CreateOutboxEntryInput,
  ): Promise<Result<OutboxEntry, DatabaseError>> {
    return this.outboxRepository.upsertEntry(tx, input);
  }

  async upsertEntry(
    input: CreateOutboxEntryInput,
  ): Promise<Result<OutboxEntry, DatabaseError>> {
    return this.outboxRepository.upsertEntry(this.dbClient, input);
  }

  async markCompleted(
    type: string,
    aggregateId: string,
    claimedAt?: Date,
  ): Promise<Result<void, DatabaseError>> {
    return this.outboxRepository.deleteEntry(
      this.dbClient,
      type,
      aggregateId,
      claimedAt,
    );
  }

  async markCompletedTx(
    tx: AppDB,
    type: string,
    aggregateId: string,
    claimedAt?: Date,
  ): Promise<Result<void, DatabaseError>> {
    return this.outboxRepository.deleteEntry(tx, type, aggregateId, claimedAt);
  }

  async getStaleEntries(
    olderThan: Date,
    limit = 50,
    type?: string,
  ): Promise<Result<OutboxEntry[], DatabaseError>> {
    return this.outboxRepository.getStaleEntries(olderThan, limit, type);
  }
}
