import { Result } from "better-result";
import { type DomainEventStrategy, EventHandlingError } from "../strategy";
import type {
  WorkspaceEventPublisher,
  PageCleanupQueue,
  PermissionCacheInvalidator,
  NotificationsService,
} from "@dotion/services";
import type { DomainEventByType } from "@dotion/shared/events";

export class PageCreatedStrategy implements DomainEventStrategy<"page.created"> {
  readonly eventType = "page.created" as const;

  constructor(private readonly workspacePublisher: WorkspaceEventPublisher) {}

  async handle(
    event: DomainEventByType<"page.created">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.workspacePublisher.broadcastPageCreated(
        event.payload.workspaceId,
        event.payload.page,
      );
      return Result.ok(undefined);
    } catch (error) {
      console.error("PageCreatedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to broadcast page.created",
          cause: error,
        }),
      );
    }
  }
}

export class PageMovedToTrashStrategy implements DomainEventStrategy<"page.moved_to_trash"> {
  readonly eventType = "page.moved_to_trash" as const;

  constructor(private readonly workspacePublisher: WorkspaceEventPublisher) {}

  async handle(
    event: DomainEventByType<"page.moved_to_trash">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      const allPageIds = [event.payload.pageId, ...event.payload.descendantIds];
      await this.workspacePublisher.broadcastPageMovedToTrash(
        event.payload.workspaceId,
        event.payload.pageId,
        allPageIds,
      );
      return Result.ok(undefined);
    } catch (error) {
      console.error("PageMovedToTrashStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to broadcast page.moved_to_trash",
          cause: error,
        }),
      );
    }
  }
}

export class PageRestoredStrategy implements DomainEventStrategy<"page.restored"> {
  readonly eventType = "page.restored" as const;

  constructor(private readonly workspacePublisher: WorkspaceEventPublisher) {}

  async handle(
    event: DomainEventByType<"page.restored">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.workspacePublisher.broadcastPageRestored(
        event.payload.workspaceId,
        event.payload.page,
      );
      return Result.ok(undefined);
    } catch (error) {
      console.error("PageRestoredStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to broadcast page.restored",
          cause: error,
        }),
      );
    }
  }
}

export class PageDeletedPermanentlyStrategy implements DomainEventStrategy<"page.deleted_permanently"> {
  readonly eventType = "page.deleted_permanently" as const;

  constructor(
    private readonly workspacePublisher: WorkspaceEventPublisher,
    private readonly pageCleanupQueue: PageCleanupQueue,
  ) {}

  async handle(
    event: DomainEventByType<"page.deleted_permanently">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await Promise.all([
        this.workspacePublisher.broadcastPageDeletedPermanently(
          event.payload.workspaceId,
          event.payload.pageId,
          event.payload.allPageIds,
        ),
        ...event.payload.allPageIds.map((pageId) =>
          this.pageCleanupQueue.enqueuePageAssetCleanup({
            workspaceId: event.payload.workspaceId,
            pageId,
          }),
        ),
      ]);
      return Result.ok(undefined);
    } catch (error) {
      console.error("PageDeletedPermanentlyStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle page.deleted_permanently",
          cause: error,
        }),
      );
    }
  }
}

export class TrashEmptiedStrategy implements DomainEventStrategy<"workspace.trash_emptied"> {
  readonly eventType = "workspace.trash_emptied" as const;

  constructor(
    private readonly workspacePublisher: WorkspaceEventPublisher,
    private readonly pageCleanupQueue: PageCleanupQueue,
  ) {}

  async handle(
    event: DomainEventByType<"workspace.trash_emptied">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await Promise.all([
        this.workspacePublisher.broadcastTrashEmptied(
          event.payload.workspaceId,
        ),
        ...event.payload.allPageIds.map((pageId) =>
          this.pageCleanupQueue.enqueuePageAssetCleanup({
            workspaceId: event.payload.workspaceId,
            pageId,
          }),
        ),
      ]);
      return Result.ok(undefined);
    } catch (error) {
      console.error("TrashEmptiedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle workspace.trash_emptied",
          cause: error,
        }),
      );
    }
  }
}

export class PageContentUpdatedStrategy implements DomainEventStrategy<"page.content_updated"> {
  readonly eventType = "page.content_updated" as const;

  constructor(private readonly queue: Queue) {}

  async handle(
    event: DomainEventByType<"page.content_updated">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.queue.send(event.payload);
      return Result.ok(undefined);
    } catch (error) {
      console.error("PageContentUpdatedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send page.content_updated to queue",
          cause: error,
        }),
      );
    }
  }
}

export class PageIndexingLegacyStrategy implements DomainEventStrategy<"page_indexing"> {
  readonly eventType = "page_indexing" as const;

  constructor(private readonly queue: Queue) {}

  async handle(
    event: DomainEventByType<"page_indexing">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.queue.send(event.payload);
      return Result.ok(undefined);
    } catch (error) {
      console.error("PageIndexingLegacyStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send page_indexing to queue",
          cause: error,
        }),
      );
    }
  }
}

export class PageMetadataUpdatedStrategy implements DomainEventStrategy<"page.metadata_updated"> {
  readonly eventType = "page.metadata_updated" as const;

  constructor(private readonly queue: Queue) {}

  async handle(
    event: DomainEventByType<"page.metadata_updated">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.queue.send(event.payload);
      return Result.ok(undefined);
    } catch (error) {
      console.error("PageMetadataUpdatedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to send page.metadata_updated to queue",
          cause: error,
        }),
      );
    }
  }
}

export class PageAccessRequestedStrategy implements DomainEventStrategy<"page.access_requested"> {
  readonly eventType = "page.access_requested" as const;

  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(
    event: DomainEventByType<"page.access_requested">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.notificationsService.createNotification({
        input: {
          userId: event.payload.recipientUserId,
          metadata: {
            type: "page_access_request",
            requestId: event.payload.requestId,
            pageId: event.payload.pageId,
            workspaceId: event.payload.workspaceId,
            pageTitle: event.payload.pageTitle,
            requestedRole: event.payload.requestedRole ?? "editor",
            requestedByUserId: event.payload.requesterId,
            requestedByName: event.payload.requesterName,
            requestedByEmail: event.payload.requesterEmail,
          },
          isRead: false,
        },
      });
      return Result.ok(undefined);
    } catch (error) {
      console.error("PageAccessRequestedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle page.access_requested",
          cause: error,
        }),
      );
    }
  }
}

export class PageAccessRequestResolvedStrategy implements DomainEventStrategy<"page.access_request_resolved"> {
  readonly eventType = "page.access_request_resolved" as const;

  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(
    event: DomainEventByType<"page.access_request_resolved">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.notificationsService.createNotification({
        input: {
          userId: event.payload.requesterId,
          metadata: {
            type: "page_access_request_resolved",
            requestId: event.payload.requestId,
            pageId: event.payload.pageId,
            workspaceId: event.payload.workspaceId,
            pageTitle: event.payload.pageTitle,
            resolvedByUserId: event.payload.reviewerId,
            resolvedByName: event.payload.reviewerName,
            status: event.payload.status,
            role: event.payload.role ?? "editor",
          },
          isRead: false,
        },
      });
      return Result.ok(undefined);
    } catch (error) {
      console.error("PageAccessRequestResolvedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle page.access_request_resolved",
          cause: error,
        }),
      );
    }
  }
}

export class PagePermissionUpdatedStrategy implements DomainEventStrategy<"page.permission_updated"> {
  readonly eventType = "page.permission_updated" as const;

  constructor(
    private readonly cacheInvalidator: PermissionCacheInvalidator,
    private readonly workspacePublisher: WorkspaceEventPublisher,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handle(
    event: DomainEventByType<"page.permission_updated">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      const tasks: Promise<unknown>[] = [
        this.cacheInvalidator.invalidateUserPermissions({
          userId: event.payload.targetUserId,
          resourceType: "page",
          id: event.payload.pageId,
        }),
        this.workspacePublisher.broadcastPagePermissionUpdated(
          event.payload.workspaceId,
          {
            pageId: event.payload.pageId,
            userId: event.payload.targetUserId,
            role: event.payload.role,
          },
        ),
      ];

      if (event.payload.pageTitle && event.payload.updatedByName) {
        tasks.push(
          this.notificationsService.createNotification({
            input: {
              userId: event.payload.targetUserId,
              metadata: {
                type: "permission_change",
                pageId: event.payload.pageId,
                workspaceId: event.payload.workspaceId,
                pageTitle: event.payload.pageTitle,
                changedByUserId: event.payload.updatedByUserId,
                changedByName: event.payload.updatedByName,
                newRole: event.payload.role,
              },
              isRead: false,
            },
          }),
        );
      }

      await Promise.all(tasks);
      return Result.ok(undefined);
    } catch (error) {
      console.error("PagePermissionUpdatedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle page.permission_updated",
          cause: error,
        }),
      );
    }
  }
}
