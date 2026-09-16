import type {
  Notification,
  NotificationId,
} from "@dotion/shared/notifications/types";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserId } from "@dotion/shared/users/types";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import type { UserWsMessage } from "@dotion/shared/notifications/ws.schema";
import { UserWsMessageSchema } from "@dotion/shared/notifications/ws.schema";
import { DurableObject } from "cloudflare:workers";
import { WsRouter } from "#/lib/ws-router";
import { createAppContext, type AppContext } from "#/context";
import type { UserWsAttachment, UserWsContext } from "./ws/types";
import {
  NotificationReadStrategy,
  NotificationAllReadStrategy,
} from "./ws/strategies/notification.strategies";

export type { UserWsAttachment, UserWsContext };

export class UsersDO extends DurableObject<Env> {
  private services?: AppContext["services"];

  private readonly router = new WsRouter<UserWsContext>()
    .register(new NotificationReadStrategy())
    .register(new NotificationAllReadStrategy());

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  private getServices() {
    if (!this.services) {
      this.services = createAppContext(this.env).services;
    }
    return this.services;
  }

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = [webSocketPair[0], webSocketPair[1]];

    const userId =
      (request.headers.get("X-User-Id") as UserId) ?? ("" as UserId);
    const permissionsHeader = request.headers.get("X-Permissions") ?? "";
    const permissions = new Set<PermissionKey>(
      permissionsHeader
        ? (permissionsHeader.split(",") as PermissionKey[])
        : [],
    );

    const attachment: UserWsAttachment = {
      userId,
      permissions,
    };

    server.serializeAttachment(attachment);

    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  private createContext(
    ws: WebSocket,
    attachment: UserWsAttachment,
  ): UserWsContext {
    return {
      ws,
      userId: attachment.userId,
      services: this.getServices(),
      hasPermission: (permission) => attachment.permissions.has(permission),
      broadcastToUser: (message, excludeCurrentTab = false) => {
        const jsonData = JSON.stringify(message);
        for (const socket of this.ctx.getWebSockets()) {
          if (!excludeCurrentTab || socket !== ws) {
            try {
              socket.send(jsonData);
            } catch (e) {
              console.error("Failed to send to user websocket:", e);
            }
          }
        }
      },
    };
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    if (typeof message !== "string") return;
    try {
      const parsed = UserWsMessageSchema.safeParse(JSON.parse(message));
      if (!parsed.success) {
        console.error("UsersDO invalid message received:", parsed.error);
        return;
      }

      const attachment = ws.deserializeAttachment() as UserWsAttachment | null;
      if (!attachment) {
        console.error("UsersDO missing attachment");
        return;
      }

      const ctx = this.createContext(ws, attachment);
      await this.router.dispatch(ctx, parsed.data.type, parsed.data.payload);
    } catch (e) {
      console.error("UsersDO message parse error:", e);
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    _wasClean: boolean,
  ) {
    if (code === 1000 || (code >= 3000 && code <= 4999)) {
      ws.close(code, reason);
    } else {
      ws.close(1000, "connection closed");
    }
  }

  broadcastNotification(notification: Notification) {
    const message: UserWsMessage = {
      type: "notification.created",
      payload: notification,
    };
    this.broadcastJson(message);
  }

  broadcastNotificationRead(notificationId: NotificationId) {
    const message: UserWsMessage = {
      type: "notification.read",
      payload: { notificationId },
    };
    this.broadcastJson(message);
  }

  broadcastNotificationAllRead(workspaceId?: WorkspaceId) {
    const message: UserWsMessage = {
      type: "notification.all_read",
      payload: { workspaceId },
    };
    this.broadcastJson(message);
  }

  broadcastJson(data: UserWsMessage) {
    const jsonData = JSON.stringify(data);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(jsonData);
      } catch (e) {
        console.error("Failed to send to user websocket:", e);
      }
    }
  }
}
