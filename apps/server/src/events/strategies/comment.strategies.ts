import { Result } from "better-result";
import { type DomainEventStrategy, EventHandlingError } from "../strategy";
import type { PageEventPublisher } from "@dotion/services";
import type { DomainEventByType } from "@dotion/shared/events";

export class CommentCreatedStrategy implements DomainEventStrategy<"comment.created"> {
  readonly eventType = "comment.created" as const;

  constructor(private readonly pagePublisher: PageEventPublisher) {}

  async handle(
    event: DomainEventByType<"comment.created">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.pagePublisher.broadcastCommentCreated(
        event.payload.pageId,
        event.payload.comment,
      );
      return Result.ok(undefined);
    } catch (error) {
      console.error("CommentCreatedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle comment.created",
          cause: error,
        }),
      );
    }
  }
}

export class CommentResolvedStrategy implements DomainEventStrategy<"comment.resolved"> {
  readonly eventType = "comment.resolved" as const;

  constructor(private readonly pagePublisher: PageEventPublisher) {}

  async handle(
    event: DomainEventByType<"comment.resolved">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.pagePublisher.broadcastCommentResolved(
        event.payload.pageId,
        event.payload.commentId,
      );
      return Result.ok(undefined);
    } catch (error) {
      console.error("CommentResolvedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle comment.resolved",
          cause: error,
        }),
      );
    }
  }
}

export class CommentDeletedStrategy implements DomainEventStrategy<"comment.deleted"> {
  readonly eventType = "comment.deleted" as const;

  constructor(private readonly pagePublisher: PageEventPublisher) {}

  async handle(
    event: DomainEventByType<"comment.deleted">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.pagePublisher.broadcastCommentDeleted(event.payload.pageId, {
        commentId: event.payload.commentId,
        parentId: event.payload.parentId,
        isRoot: event.payload.isRoot,
      });
      return Result.ok(undefined);
    } catch (error) {
      console.error("CommentDeletedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle comment.deleted",
          cause: error,
        }),
      );
    }
  }
}
