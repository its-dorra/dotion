import type { UserId } from "@dotion/shared/users/types";
import type {
  WorkspaceId,
  WorkspaceMemberDetail,
  WorkspaceInvitationWithDetails,
} from "@dotion/shared/workspaces/types";
import type { PageId, Page } from "@dotion/shared/pages/types";
import type {
  CommentId,
  CommentWithRepliesAndAuthor,
} from "@dotion/shared/comments/types";
import type { Notification } from "@dotion/shared/notifications/types";
import type { ResourceType } from "@dotion/shared/authorization/types";

export interface PermissionCacheInvalidator {
  invalidateUserPermissions(
    userId: string,
    resourceType?: ResourceType,
    id?: string,
  ): Promise<void>;
}

export interface WorkspaceEventPublisher {
  broadcastPageCreated(workspaceId: WorkspaceId, page: Page): Promise<void>;
  broadcastMemberJoined(
    workspaceId: WorkspaceId,
    payload: { invitationId: string; member: WorkspaceMemberDetail },
  ): Promise<void>;
  broadcastMemberRemoved(
    workspaceId: WorkspaceId,
    userId: UserId,
  ): Promise<void>;
  broadcastInvitationCreated(
    workspaceId: WorkspaceId,
    invitation: WorkspaceInvitationWithDetails,
  ): Promise<void>;
  broadcastInvitationCancelled(
    workspaceId: WorkspaceId,
    invitationId: string,
  ): Promise<void>;
  broadcastInvitationDeclined(
    workspaceId: WorkspaceId,
    invitationId: string,
  ): Promise<void>;
  broadcastPagePermissionUpdated(
    workspaceId: WorkspaceId,
    payload: { pageId: PageId; userId: UserId; role: string },
  ): Promise<void>;
  broadcastPageMovedToTrash(
    workspaceId: WorkspaceId,
    pageId: PageId,
    pageIds?: PageId[],
  ): Promise<void>;
  broadcastPageRestored(workspaceId: WorkspaceId, page: Page): Promise<void>;
  broadcastPageDeletedPermanently(
    workspaceId: WorkspaceId,
    pageId: PageId,
    pageIds?: PageId[],
  ): Promise<void>;
  broadcastTrashEmptied(workspaceId: WorkspaceId): Promise<void>;
}

export interface PageCleanupQueue {
  enqueuePageAssetCleanup(payload: {
    workspaceId: WorkspaceId;
    pageId: PageId;
  }): Promise<void>;
}

export interface PageEventPublisher {
  broadcastCommentCreated(
    pageId: PageId,
    comment: CommentWithRepliesAndAuthor,
  ): Promise<void>;
  broadcastCommentResolved(pageId: PageId, commentId: CommentId): Promise<void>;
  broadcastCommentDeleted(
    pageId: PageId,
    payload: {
      commentId: CommentId;
      parentId: CommentId | null;
      isRoot: boolean;
    },
  ): Promise<void>;
}

export interface UserEventPublisher {
  broadcastNotification(
    userId: UserId,
    notification: Notification,
  ): Promise<void>;
  broadcastNotificationRead(
    userId: UserId,
    notificationId: string,
  ): Promise<void>;
  broadcastNotificationAllRead(userId: UserId): Promise<void>;
}

export interface UserCreditsManager {
  checkTokenQuota(
    userId: UserId,
    params?: { minTokens: number },
  ): Promise<{
    allowed: boolean;
    remainingTokens: number;
    resetAt: number;
    message?: string;
  }>;
  settleTokenUsage(
    userId: UserId,
    params: { tokensUsed: number; metadata: string },
  ): Promise<{
    remainingTokens: number;
    totalUsed: number;
  }>;
}
