import type { Result } from "better-result";
import type { DomainEvent } from "@dotion/shared/events";

export interface DomainEventDispatcher {
  dispatch(event: DomainEvent): Promise<Result<void, never>>;
  dispatchBatch(events: DomainEvent[]): Promise<Result<void, never>>;
}
