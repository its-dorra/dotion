import type { UserId } from "@dotion/shared/users/types";
import { WorkspaceWsMessageSchema } from "@dotion/shared/workspaces/ws.schema";
import type { WorkspaceWsMessage } from "@dotion/shared/workspaces/types";
import { DurableObject } from "cloudflare:workers";

export type Attachments = {
  userId: UserId;
};

export class WorkspacesDO extends DurableObject<Env> {
  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();

    const [client, server] = [webSocketPair[0], webSocketPair[1]];

    this.ctx.acceptWebSocket(server);

    const userId = request.headers.get("X-User-Id") as UserId;

    server.serializeAttachment({
      userId,
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(_ws: WebSocket, message: ArrayBuffer | string) {
    if (typeof message !== "string") return;
    const data = WorkspaceWsMessageSchema.safeParse(JSON.parse(message));
    if (!data.success) {
      console.error("Invalid message received:", data.error);
      return;
    }
  }

  async webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    _wasClean: boolean,
  ) {
    /*
     * Only forward valid close codes.
     * Code 1006 (abnormal closure) is reserved and cannot be used in ws.close().
     */
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
}
