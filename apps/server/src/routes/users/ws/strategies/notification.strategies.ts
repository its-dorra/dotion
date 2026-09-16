import type { WsStrategy } from "#/lib/ws-router";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import type { UserWsMessage } from "@dotion/shared/notifications/types";
import type { UserWsContext } from "../types";

type NotificationReadPayload = Extract<
  UserWsMessage,
  { type: "notification.read" }
>["payload"];

type NotificationAllReadPayload = Extract<
  UserWsMessage,
  { type: "notification.all_read" }
>["payload"];

export class NotificationReadStrategy implements WsStrategy<
  UserWsContext,
  NotificationReadPayload
> {
  readonly messageType = "notification.read";
  readonly requiredPermission: PermissionKey = "user:update";

  async handle(
    ctx: UserWsContext,
    payload: NotificationReadPayload,
  ): Promise<void> {
    await ctx.services.notifications.markAsRead({
      userId: ctx.userId,
      notificationId: payload.notificationId,
    });
    ctx.broadcastToUser({ type: "notification.read", payload }, true);
  }
}

export class NotificationAllReadStrategy implements WsStrategy<
  UserWsContext,
  NotificationAllReadPayload
> {
  readonly messageType = "notification.all_read";
  readonly requiredPermission: PermissionKey = "user:update";

  async handle(
    ctx: UserWsContext,
    payload: NotificationAllReadPayload,
  ): Promise<void> {
    await ctx.services.notifications.markAllAsRead({ userId: ctx.userId });
    ctx.broadcastToUser({ type: "notification.all_read", payload }, true);
  }
}
