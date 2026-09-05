import type {
  Notification,
  NotificationId,
} from "@dotion/shared/notifications/types";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserWsMessage } from "@dotion/shared/notifications/ws.schema";
import { UserWsMessageSchema } from "@dotion/shared/notifications/ws.schema";
import { DurableObject } from "cloudflare:workers";

export class UsersDO extends DurableObject<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = [webSocketPair[0], webSocketPair[1]];

    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(_ws: WebSocket, message: ArrayBuffer | string) {
    if (typeof message !== "string") return;
    try {
      const data = UserWsMessageSchema.safeParse(JSON.parse(message));
      if (!data.success) {
        console.error("UsersDO invalid message received:", data.error);
        return;
      }
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
