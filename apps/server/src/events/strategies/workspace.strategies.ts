import { Result } from "better-result";
import { type DomainEventStrategy, EventHandlingError } from "../strategy";
import type {
  WorkspaceEventPublisher,
  PermissionCacheInvalidator,
  NotificationsService,
} from "@dotion/services";
import type { DomainEventByType } from "@dotion/shared/events";

export class WorkspaceInvitationCreatedStrategy implements DomainEventStrategy<"workspace.invitation_created"> {
  readonly eventType = "workspace.invitation_created" as const;

  constructor(
    private readonly workspacePublisher: WorkspaceEventPublisher,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handle(
    event: DomainEventByType<"workspace.invitation_created">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      const { workspaceId, invitation, invitedUserId, invitedByUserId } =
        event.payload;

      await Promise.all([
        this.workspacePublisher.broadcastInvitationCreated(
          workspaceId,
          invitation,
        ),
        this.notificationsService.createNotification({
          input: {
            userId: invitedUserId,
            metadata: {
              type: "workspace.invitation_created",
              workspaceInvitationId: invitation.id,
              workspaceId,
              workspaceName: invitation.workspaceName,
              invitedByUserId,
              invitedByName: invitation.invitedByName,
            },
            isRead: false,
          },
        }),
      ]);

      return Result.ok(undefined);
    } catch (error) {
      console.error("WorkspaceInvitationCreatedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle workspace.invitation_created",
          cause: error,
        }),
      );
    }
  }
}

export class WorkspaceMemberJoinedStrategy implements DomainEventStrategy<"workspace.member_joined"> {
  readonly eventType = "workspace.member_joined" as const;

  constructor(
    private readonly workspacePublisher: WorkspaceEventPublisher,
    private readonly cacheInvalidator: PermissionCacheInvalidator,
  ) {}

  async handle(
    event: DomainEventByType<"workspace.member_joined">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await Promise.all([
        this.cacheInvalidator.invalidateUserPermissions({
          userId: event.payload.userId,
          workspaceId: event.payload.workspaceId,
        }),
        this.workspacePublisher.broadcastMemberJoined(
          event.payload.workspaceId,
          {
            invitationId: event.payload.invitationId,
            member: event.payload.member,
          },
        ),
      ]);
      return Result.ok(undefined);
    } catch (error) {
      console.error("WorkspaceMemberJoinedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle workspace.member_joined",
          cause: error,
        }),
      );
    }
  }
}

export class WorkspaceMemberRemovedStrategy implements DomainEventStrategy<"workspace.member_removed"> {
  readonly eventType = "workspace.member_removed" as const;

  constructor(
    private readonly workspacePublisher: WorkspaceEventPublisher,
    private readonly cacheInvalidator: PermissionCacheInvalidator,
  ) {}

  async handle(
    event: DomainEventByType<"workspace.member_removed">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await Promise.all([
        this.cacheInvalidator.invalidateUserPermissions({
          userId: event.payload.userId,
          workspaceId: event.payload.workspaceId,
        }),
        this.workspacePublisher.broadcastMemberRemoved(
          event.payload.workspaceId,
          event.payload.userId,
        ),
        this.workspacePublisher.disconnectUser(
          event.payload.workspaceId,
          event.payload.userId,
          "Removed from workspace",
        ),
      ]);
      return Result.ok(undefined);
    } catch (error) {
      console.error("WorkspaceMemberRemovedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle workspace.member_removed",
          cause: error,
        }),
      );
    }
  }
}

export class WorkspaceInvitationCancelledStrategy implements DomainEventStrategy<"workspace.invitation_cancelled"> {
  readonly eventType = "workspace.invitation_cancelled" as const;

  constructor(private readonly workspacePublisher: WorkspaceEventPublisher) {}

  async handle(
    event: DomainEventByType<"workspace.invitation_cancelled">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.workspacePublisher.broadcastInvitationCancelled(
        event.payload.workspaceId,
        event.payload.invitationId,
      );
      return Result.ok(undefined);
    } catch (error) {
      console.error("WorkspaceInvitationCancelledStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle workspace.invitation_cancelled",
          cause: error,
        }),
      );
    }
  }
}

export class WorkspaceInvitationDeclinedStrategy implements DomainEventStrategy<"workspace.invitation_declined"> {
  readonly eventType = "workspace.invitation_declined" as const;

  constructor(private readonly workspacePublisher: WorkspaceEventPublisher) {}

  async handle(
    event: DomainEventByType<"workspace.invitation_declined">,
  ): Promise<Result<void, EventHandlingError>> {
    try {
      await this.workspacePublisher.broadcastInvitationDeclined(
        event.payload.workspaceId,
        event.payload.invitationId,
      );
      return Result.ok(undefined);
    } catch (error) {
      console.error("WorkspaceInvitationDeclinedStrategy error:", error);
      return Result.err(
        new EventHandlingError({
          eventType: this.eventType,
          message:
            error instanceof Error
              ? error.message
              : "Failed to handle workspace.invitation_declined",
          cause: error,
        }),
      );
    }
  }
}
