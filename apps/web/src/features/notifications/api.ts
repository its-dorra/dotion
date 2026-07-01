import { Result } from "better-result";
import { AppError } from "@/lib/errors";
import { NotificationNotFoundError } from "./errors";
import type { Notification } from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let mockNotifications: Notification[] = [
  {
    id: "notif_1",
    type: "workspace_invitation",
    isRead: false,
    createdAt: "2026-06-20T09:00:00.000Z",
    workspaceInvitationId: "inv_1",
    workspaceName: "Design Collective",
    workspaceIcon: "🎨",
    invitedByName: "Riley Chen",
  },
  {
    id: "notif_2",
    type: "mention",
    isRead: false,
    createdAt: "2026-06-23T11:05:00.000Z",
    pageId: "page_child_1",
    workspaceId: "ws_1",
    pageTitle: "Architecture Decisions",
    mentionedByName: "Jordan Lee",
    excerpt: "…cc @Sam can you confirm the retry policy for the queue?",
  },
  {
    id: "notif_3",
    type: "permission_change",
    isRead: true,
    createdAt: "2026-06-19T15:30:00.000Z",
    pageId: "page_child_2",
    workspaceId: "ws_1",
    pageTitle: "On-call Runbook",
    changedByName: "Sam",
    newRole: "commenter",
  },
  {
    id: "notif_4",
    type: "page_access_request",
    isRead: false,
    createdAt: "2026-06-24T08:20:00.000Z",
    pageId: "page_root_2",
    workspaceId: "ws_1",
    pageTitle: "Engineering",
    requestedByName: "Mateo Garcia",
    requestedByEmail: "mateo@example.com",
  },
];

export class NotificationsApi {
  async getNotifications(): Promise<Result<Notification[], AppError>> {
    await delay(400);
    return Result.ok(
      [...mockNotifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }

  async markAsRead(
    notificationId: string,
  ): Promise<Result<true, NotificationNotFoundError>> {
    await delay(250);

    const exists = mockNotifications.some((n) => n.id === notificationId);
    if (!exists) {
      return Result.err(
        new NotificationNotFoundError({
          message: "This notification no longer exists.",
          notificationId,
        }),
      );
    }

    mockNotifications = mockNotifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n,
    );

    return Result.ok(true);
  }

  async markAllAsRead(): Promise<Result<true, AppError>> {
    await delay(300);
    mockNotifications = mockNotifications.map((n) => ({ ...n, isRead: true }));
    return Result.ok(true);
  }
}

export const notificationsApi = new NotificationsApi();
