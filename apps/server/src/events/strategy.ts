import { Result, TaggedError } from "better-result";
import type {
  DomainEvent,
  DomainEventType,
  DomainEventByType,
} from "@dotion/shared/events";
import type { DomainEventDispatcher } from "@dotion/services";

export interface ExecutionContextLike {
  waitUntil(promise: Promise<unknown>): void;
}

export class EventHandlingError extends TaggedError("EventHandlingError")<{
  eventType: string;
  message: string;
  cause?: unknown;
}> {}

export interface DomainEventStrategy<
  T extends DomainEventType = DomainEventType,
> {
  readonly eventType: T;
  handle(
    event: DomainEventByType<T>,
  ): Promise<Result<void, EventHandlingError>>;
}

export class DomainEventRouter implements DomainEventDispatcher {
  private readonly strategies = new Map<
    DomainEventType,
    DomainEventStrategy<any>[]
  >();

  constructor(private readonly executionCtx?: ExecutionContextLike) {}

  register<T extends DomainEventType>(strategy: DomainEventStrategy<T>): this {
    const list = this.strategies.get(strategy.eventType) ?? [];
    list.push(strategy);
    this.strategies.set(strategy.eventType, list);
    return this;
  }

  private dispatchSingle(event: DomainEvent): Promise<undefined>[] {
    const matched = this.strategies.get(event.type);
    if (!matched || matched.length === 0) return [];

    return matched.map(async (strategy) => {
      const result = await strategy.handle(event);
      if (result.isErr()) {
        console.error(
          `[DomainEventRouter] Strategy failed for event ${event.type}:`,
          result.error,
        );
      }

      return undefined;
    });
  }

  async dispatch(event: DomainEvent): Promise<Result<void, never>> {
    const task = Promise.all(this.dispatchSingle(event));

    if (this.executionCtx) {
      this.executionCtx.waitUntil(task);
    } else {
      await task;
    }

    return Result.ok(undefined);
  }

  async dispatchBatch(events: DomainEvent[]): Promise<Result<void, never>> {
    if (events.length === 0) return Result.ok(undefined);

    const task = Promise.all(
      events
        .map((event) => this.dispatchSingle(event))
        .flatMap((promises) => promises),
    );

    if (this.executionCtx) {
      this.executionCtx.waitUntil(task);
    } else {
      await task;
    }

    return Result.ok(undefined);
  }
}
