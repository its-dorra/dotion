import type { UserId } from "@dotion/shared/users/types";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import { WorkspaceWsMessageSchema } from "@dotion/shared/workspaces/ws.schema";
import type { WorkspaceWsMessage } from "@dotion/shared/workspaces/types";
import { DurableObject } from "cloudflare:workers";
import { WsRouter } from "#/lib/ws-router";
import type { WorkspaceWsAttachment, WorkspaceWsContext } from "./ws/types";
import {
  DocumentTitleChangedStrategy,
  DocumentIconChangedStrategy,
  DocumentCoverChangedStrategy,
} from "./ws/strategies/workspace.strategies";

export class WorkspacesDO extends DurableObject<Env> {
  private readonly router = new WsRouter<WorkspaceWsContext>()
    .register(new DocumentTitleChangedStrategy())
    .register(new DocumentIconChangedStrategy())
    .register(new DocumentCoverChangedStrategy());

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = [webSocketPair[0], webSocketPair[1]];

    const userId = request.headers.get("X-User-Id") as UserId;
    const workspaceId = request.headers.get("X-Workspace-Id") as WorkspaceId;
    const permissionsHeader = request.headers.get("X-Permissions");

    if (!userId || !workspaceId || !permissionsHeader) {
      return new Response("Missing required headers", { status: 400 });
    }

    const permissions = new Set<PermissionKey>(
      permissionsHeader
        ? (permissionsHeader.split(",") as PermissionKey[])
        : [],
    );

    const attachment: WorkspaceWsAttachment = {
      userId,
      workspaceId,
      permissions,
    };

    server.serializeAttachment(attachment);

    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  private createContext(
    ws: WebSocket,
    attachment: WorkspaceWsAttachment,
  ): WorkspaceWsContext {
    return {
      ws,
      userId: attachment.userId,
      workspaceId: attachment.workspaceId,
      hasPermission: (permission) => attachment.permissions.has(permission),
      broadcastToAll: (data) => this.broadcastJSONToAll(data),
      broadcastToAllExceptSender: (data) =>
        this.broadcastJSONToAllExceptSender(ws, data),
    };
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    if (typeof message !== "string") return;
    try {
      const parsed = WorkspaceWsMessageSchema.safeParse(JSON.parse(message));
      if (!parsed.success) {
        console.error("WorkspacesDO invalid message received:", parsed.error);
        return;
      }

      const attachment =
        ws.deserializeAttachment() as WorkspaceWsAttachment | null;
      if (!attachment) {
        console.error("WorkspacesDO missing attachment");
        return;
      }

      const ctx = this.createContext(ws, attachment);
      await this.router.dispatch(ctx, parsed.data.type, parsed.data.payload);
    } catch (e) {
      console.error("WorkspacesDO message parse error:", e);
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

  broadcastJSONToAllExceptSender(ws: WebSocket, data: WorkspaceWsMessage) {
    const jsonData = JSON.stringify(data);
    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== ws) {
        socket.send(jsonData);
      }
    }
  }

  broadcastJSONToAll(data: WorkspaceWsMessage) {
    const jsonData = JSON.stringify(data);
    for (const ws of this.ctx.getWebSockets()) {
      ws.send(jsonData);
    }
  }

  disconnectUser(userId: UserId, reason = "Removed from workspace"): void {
    for (const ws of this.ctx.getWebSockets()) {
      const attachment =
        ws.deserializeAttachment() as WorkspaceWsAttachment | null;
      if (attachment && attachment.userId === userId) {
        ws.close(4403, reason);
      }
    }
  }
}
