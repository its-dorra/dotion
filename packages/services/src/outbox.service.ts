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
    _dbClient: DBClient,
  ) {}

  async emitEventTx({
    tx,
    event,
  }: {
    tx: AppDB;
    event: DomainEvent;
  }): Promise<Result<OutboxEntry, DatabaseError>> {
    return this.outboxRepository.upsertEntryTx({
      tx,
      input: {
        type: event.type,
        aggregateId: event.aggregateId,
        payload: event.payload as Record<string, unknown>,
      },
    });
  }

  async emitEvent({
    event,
  }: {
    event: DomainEvent;
  }): Promise<Result<OutboxEntry, DatabaseError>> {
    return this.outboxRepository.upsertEntry({
      input: {
        type: event.type,
        aggregateId: event.aggregateId,
        payload: event.payload as Record<string, unknown>,
      },
    });
  }

  async upsertEntryTx({
    tx,
    input,
  }: {
    tx: AppDB;
    input: CreateOutboxEntryInput;
  }): Promise<Result<OutboxEntry, DatabaseError>> {
    return this.outboxRepository.upsertEntryTx({ tx, input });
  }

  async upsertEntry({
    input,
  }: {
    input: CreateOutboxEntryInput;
  }): Promise<Result<OutboxEntry, DatabaseError>> {
    return this.outboxRepository.upsertEntry({ input });
  }

  async markCompleted({
    type,
    aggregateId,
    claimedAt,
  }: {
    type: string;
    aggregateId: string;
    claimedAt?: Date;
  }): Promise<Result<void, DatabaseError>> {
    return this.outboxRepository.deleteEntry({
      type,
      aggregateId,
      claimedAt,
    });
  }

  async markCompletedTx({
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
    return this.outboxRepository.deleteEntryTx({
      tx,
      type,
      aggregateId,
      claimedAt,
    });
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
    return this.outboxRepository.getStaleEntries({
      olderThan,
      limit,
      type,
    });
  }
}
