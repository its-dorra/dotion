import type {
  WorkspaceEventPublisher,
  PageEventPublisher,
  UserEventPublisher,
  UserCreditsManager,
  PageCleanupQueue,
} from "@dotion/services";
import type { WorkspaceId, PageId } from "@dotion/shared/ids";
import type { UserId } from "@dotion/shared/users/types";
import type { Page, PagePermissionRole } from "@dotion/shared/pages/types";
import type {
  WorkspaceMemberDetail,
  WorkspaceInvitationWithDetails,
} from "@dotion/shared/workspaces/types";
import type {
  CommentId,
  CommentWithRepliesAndAuthor,
} from "@dotion/shared/comments/types";
import type {
  Notification,
  NotificationId,
} from "@dotion/shared/notifications/types";

export class DurableObjectWorkspaceEventPublisher implements WorkspaceEventPublisher {
  constructor(private readonly env: Env) {}

  async broadcastPageCreated(
    workspaceId: WorkspaceId,
    page: Page,
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "page.created",
        payload: page,
      });
    } catch (error) {
      console.error("Failed to broadcast page.created:", error);
    }
  }

  async broadcastMemberJoined(
    workspaceId: WorkspaceId,
    payload: { invitationId: string; member: WorkspaceMemberDetail },
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "workspace.member_joined",
        payload: {
          workspaceId,
          invitationId: payload.invitationId as any,
          member: payload.member,
        },
      });
    } catch (error) {
      console.error("Failed to broadcast workspace.member_joined:", error);
    }
  }

  async broadcastMemberRemoved(
    workspaceId: WorkspaceId,
    userId: UserId,
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "workspace.member_removed",
        payload: {
          workspaceId,
          userId,
        },
      });
    } catch (error) {
      console.error("Failed to broadcast workspace.member_removed:", error);
    }
  }

  async broadcastInvitationCreated(
    workspaceId: WorkspaceId,
    invitation: WorkspaceInvitationWithDetails,
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "workspace.invitation_created",
        payload: invitation,
      });
    } catch (error) {
      console.error("Failed to broadcast workspace.invitation_created:", error);
    }
  }

  async broadcastInvitationCancelled(
    workspaceId: WorkspaceId,
    invitationId: string,
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "workspace.invitation_cancelled",
        payload: {
          workspaceId,
          invitationId: invitationId as any,
        },
      });
    } catch (error) {
      console.error(
        "Failed to broadcast workspace.invitation_cancelled:",
        error,
      );
    }
  }

  async broadcastInvitationDeclined(
    workspaceId: WorkspaceId,
    invitationId: string,
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "workspace.invitation_declined",
        payload: {
          workspaceId,
          invitationId: invitationId as any,
        },
      });
    } catch (error) {
      console.error(
        "Failed to broadcast workspace.invitation_declined:",
        error,
      );
    }
  }

  async broadcastPagePermissionUpdated(
    workspaceId: WorkspaceId,
    payload: { pageId: PageId; userId: UserId; role: string },
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "page.permission_updated",
        payload: {
          workspaceId,
          pageId: payload.pageId,
          userId: payload.userId,
          role: payload.role as PagePermissionRole,
        },
      });
    } catch (error) {
      console.error("Failed to broadcast page.permission_updated:", error);
    }
  }

  async broadcastPageMovedToTrash(
    workspaceId: WorkspaceId,
    pageId: PageId,
    pageIds: PageId[],
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "page.moved_to_trash",
        payload: {
          workspaceId,
          pageId,
          pageIds,
        },
      });
    } catch (error) {
      console.error("Failed to broadcast page.moved_to_trash:", error);
    }
  }

  async broadcastPageRestored(
    workspaceId: WorkspaceId,
    page: Page,
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "page.restored",
        payload: page,
      });
    } catch (error) {
      console.error("Failed to broadcast page.restored:", error);
    }
  }

  async broadcastPageDeletedPermanently(
    workspaceId: WorkspaceId,
    pageId: PageId,
    pageIds: PageId[],
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "page.deleted_permanently",
        payload: {
          workspaceId,
          pageId,
          pageIds,
        },
      });
    } catch (error) {
      console.error("Failed to broadcast page.deleted_permanently:", error);
    }
  }

  async broadcastTrashEmptied(workspaceId: WorkspaceId): Promise<void> {
    try {
      const doId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
      const stub = this.env.DOTION_WORKSPACE_DO.get(doId);
      await stub.broadcastJSONToAll({
        type: "trash.emptied",
        payload: {
          workspaceId,
        },
      });
    } catch (error) {
      console.error("Failed to broadcast trash.emptied:", error);
    }
  }
}

export class DurableObjectPageEventPublisher implements PageEventPublisher {
  constructor(private readonly env: Env) {}

  async broadcastCommentCreated(
    pageId: PageId,
    comment: CommentWithRepliesAndAuthor,
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_PAGES_DO.idFromName(pageId);
      const stub = this.env.DOTION_PAGES_DO.get(doId);
      await stub.broadcastCommentEvent({
        type: "comment.created",
        payload: { comment },
      });
    } catch (error) {
      console.error("Failed to broadcast comment.created:", error);
    }
  }

  async broadcastCommentResolved(
    pageId: PageId,
    commentId: CommentId,
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_PAGES_DO.idFromName(pageId);
      const stub = this.env.DOTION_PAGES_DO.get(doId);
      await stub.broadcastCommentEvent({
        type: "comment.resolved",
        payload: { commentId },
      });
    } catch (error) {
      console.error("Failed to broadcast comment.resolved:", error);
    }
  }

  async broadcastCommentDeleted(
    pageId: PageId,
    payload: {
      commentId: CommentId;
      parentId: CommentId | null;
      isRoot: boolean;
    },
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_PAGES_DO.idFromName(pageId);
      const stub = this.env.DOTION_PAGES_DO.get(doId);
      await stub.broadcastCommentEvent({
        type: "comment.deleted",
        payload,
      });
    } catch (error) {
      console.error("Failed to broadcast comment.deleted:", error);
    }
  }
}

export class DurableObjectUserEventPublisher implements UserEventPublisher {
  constructor(private readonly env: Env) {}

  async broadcastNotification(
    userId: UserId,
    notification: Notification,
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_USERS_DO.idFromName(userId);
      const stub = this.env.DOTION_USERS_DO.get(doId);
      await stub.broadcastNotification(notification);
    } catch (error) {
      console.error("Failed to broadcast notification:", error);
    }
  }

  async broadcastNotificationRead(
    userId: UserId,
    notificationId: string,
  ): Promise<void> {
    try {
      const doId = this.env.DOTION_USERS_DO.idFromName(userId);
      const stub = this.env.DOTION_USERS_DO.get(doId);
      await stub.broadcastNotificationRead(notificationId as NotificationId);
    } catch (error) {
      console.error("Failed to broadcast notification read:", error);
    }
  }

  async broadcastNotificationAllRead(userId: UserId): Promise<void> {
    try {
      const doId = this.env.DOTION_USERS_DO.idFromName(userId);
      const stub = this.env.DOTION_USERS_DO.get(doId);
      await stub.broadcastNotificationAllRead();
    } catch (error) {
      console.error("Failed to broadcast all notifications read:", error);
    }
  }
}

export class DurableObjectUserCreditsManager implements UserCreditsManager {
  constructor(private readonly env: Env) {}

  async checkTokenQuota(
    userId: UserId,
    params: { minTokens: number },
  ): Promise<{
    allowed: boolean;
    remainingTokens: number;
    resetAt: number;
    message?: string;
  }> {
    const doId = this.env.DOTION_USER_CREDITS_DO.idFromName(userId);
    const stub = this.env.DOTION_USER_CREDITS_DO.get(doId);
    return stub.checkTokenQuota(params);
  }

  async settleTokenUsage(
    userId: UserId,
    params: { tokensUsed: number; metadata: string },
  ): Promise<{
    remainingTokens: number;
    totalUsed: number;
  }> {
    const doId = this.env.DOTION_USER_CREDITS_DO.idFromName(userId);
    const stub = this.env.DOTION_USER_CREDITS_DO.get(doId);
    return stub.settleTokenUsage(params);
  }
}

export class CloudflarePageCleanupQueue implements PageCleanupQueue {
  constructor(private readonly env: Env) {}

  async enqueuePageAssetCleanup(payload: {
    workspaceId: WorkspaceId;
    pageId: PageId;
  }): Promise<void> {
    try {
      await this.env.PAGE_CLEANUP_QUEUE.send(payload);
    } catch (error) {
      console.error("Failed to enqueue page asset cleanup:", error);
    }
  }
}
