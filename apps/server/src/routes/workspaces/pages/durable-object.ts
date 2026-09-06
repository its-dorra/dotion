import type { UserId } from "@dotion/shared/users/types";
import type {
  PageId,
  UpdatePageMetadataInput,
} from "@dotion/shared/pages/types";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { CommentWsMessage } from "@dotion/shared/comments/types";
import { PageClientWsMessageSchema } from "@dotion/shared/pages/schema";

import { DurableObject } from "cloudflare:workers";

import { PageDocument } from "./page-document";
import { PagePersistence } from "./page-persistence";
import { YjsProtocol } from "./yjs-protocol";
import { createAppContext } from "#/context";

export type WsAttachment = {
  userId: UserId;
  userName: string;
  userColor: string;
  awarenessClientIds: number[];
};

const STORAGE_PAGE_ID = "pageId";
const STORAGE_WORKSPACE_ID = "workspaceId";

export class PagesDO extends DurableObject<Env> {
  private document: PageDocument | null = null;

  private persistence: PagePersistence | null = null;

  private initialization: Promise<PageDocument> | null = null;

  private pageId: PageId | null = null;
  private workspaceId: WorkspaceId | null = null;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  private async initialize(
    pageId: PageId,
    workspaceId: WorkspaceId,
  ): Promise<PageDocument> {
    if (this.document) {
      if (!this.workspaceId) {
        this.workspaceId = workspaceId;
        await this.ctx.storage.put(STORAGE_WORKSPACE_ID, workspaceId);
      }
      return this.document;
    }

    if (this.initialization) {
      return this.initialization;
    }

    this.initialization = this.initializeInternal(pageId, workspaceId);

    try {
      return await this.initialization;
    } finally {
      this.initialization = null;
    }
  }

  private async initializeInternal(
    pageId: PageId,
    workspaceId: WorkspaceId,
  ): Promise<PageDocument> {
    const storedPageId = await this.ctx.storage.get<PageId>(STORAGE_PAGE_ID);

    if (!storedPageId) {
      await this.ctx.storage.put(STORAGE_PAGE_ID, pageId);
    }

    this.pageId = pageId;

    const storedWorkspaceId =
      await this.ctx.storage.get<WorkspaceId>(STORAGE_WORKSPACE_ID);
    if (workspaceId) {
      this.workspaceId = workspaceId;
      await this.ctx.storage.put(STORAGE_WORKSPACE_ID, workspaceId);
    } else if (storedWorkspaceId) {
      this.workspaceId = storedWorkspaceId;
    }

    const { services } = createAppContext(this.env);
    const persistence = new PagePersistence(
      this.ctx.storage,
      services.pages,
      this.pageId,
      this.env,
      this.workspaceId,
    );

    const document = new PageDocument();

    const initialState = await persistence.loadInitialState(document);

    if (initialState) {
      document.load(initialState);
    }

    document.onUpdate(() => {
      void persistence.onDocumentUpdate(document);
    });

    this.persistence = persistence;
    this.document = document;

    return document;
  }

  async fetch(request: Request): Promise<Response> {
    const pageId = this.getPageIdFromRequest(request);
    const workspaceId = this.getWorkspaceIdFromRequest(request);

    if (!pageId || !workspaceId) {
      return new Response("Missing required headers", { status: 400 });
    }

    let document: PageDocument;

    try {
      document = await this.initialize(pageId, workspaceId);
    } catch (error: unknown) {
      console.error("PagesDO: failed to initialize document:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to initialize document";

      return new Response(message, { status: 400 });
    }

    return this.acceptWebSocket(request, document);
  }

  private getPageIdFromRequest(request: Request): PageId | null {
    const pageId = request.headers.get("X-Page-Id") as PageId | null;

    return pageId;
  }

  private getWorkspaceIdFromRequest(request: Request): WorkspaceId | null {
    const workspaceId = request.headers.get(
      "X-Workspace-Id",
    ) as WorkspaceId | null;

    return workspaceId;
  }

  private acceptWebSocket(request: Request, _document: PageDocument): Response {
    const pair = new WebSocketPair();

    const client = pair[0];
    const server = pair[1];

    const userIdHeader = request.headers.get("X-User-Id");

    if (!userIdHeader) {
      return new Response("Missing authenticated user", { status: 401 });
    }

    const attachment: WsAttachment = {
      userId: userIdHeader as UserId,

      userName: request.headers.get("X-User-Name") ?? "Anonymous",

      userColor: request.headers.get("X-User-Color") ?? "#808080",

      awarenessClientIds: [],
    };

    server.serializeAttachment(attachment);

    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(
    ws: WebSocket,
    message: ArrayBuffer | string,
  ): Promise<void> {
    if (typeof message === "string") {
      try {
        const json = JSON.parse(message);
        const parsed = PageClientWsMessageSchema.safeParse(json);
        if (!parsed.success) {
          console.error(
            "PagesDO: received invalid string WS message:",
            parsed.error,
          );
          return;
        }
        const data = parsed.data;
        if (data.type === "page.update_metadata") {
          await this.broadcastMetadataChanges(data.payload);
          await this.persistence?.queueMetadataUpdate(
            data.payload,
            this.document,
          );
        }
      } catch (error) {
        console.error("PagesDO: error handling string WS message:", error);
      }
      return;
    }
    if (!this.document) {
      console.error(
        "PagesDO: received WebSocket message before document initialization",
      );

      return;
    }

    const data = new Uint8Array(message);

    const result = YjsProtocol.handleMessage(
      data,
      this.document.getDoc(),
      this.document.getAwareness(),
      ws,
    );

    /*
     * SyncStep1 / SyncStep2 response.
     */
    if (result.reply) {
      ws.send(result.reply);
    }

    /*
     * Actual Yjs update / awareness update.
     */
    if (result.broadcastData) {
      this.broadcastBinary(ws, result.broadcastData);
    }

    /*
     * Remember which awareness client IDs belong to this connection.
     */
    if (result.awarenessClientIds && result.awarenessClientIds.length > 0) {
      this.addAwarenessClientIds(ws, result.awarenessClientIds);
    }
  }

  async webSocketClose(
    ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean,
  ): Promise<void> {
    if (this.document) {
      this.removeConnectionAwareness(ws, this.document);
    }

    /*
     * Persist immediately when the last client leaves.
     */
    const remaining = this.ctx.getWebSockets();

    if (remaining.length === 0 && this.persistence) {
      await this.persistence.persistImmediately(this.document);
    }
  }
  async webSocketError(_ws: WebSocket, error: unknown): Promise<void> {
    console.error("PagesDO: WebSocket error:", error);
  }

  private addAwarenessClientIds(ws: WebSocket, clientIds: number[]): void {
    const attachment = ws.deserializeAttachment() as WsAttachment | null;

    if (!attachment) {
      return;
    }

    const ids = new Set(attachment.awarenessClientIds);

    for (const clientId of clientIds) {
      ids.add(clientId);
    }

    attachment.awarenessClientIds = Array.from(ids);

    ws.serializeAttachment(attachment);
  }

  private removeConnectionAwareness(
    ws: WebSocket,
    document: PageDocument,
  ): void {
    const attachment = ws.deserializeAttachment() as WsAttachment | null;

    if (!attachment || attachment.awarenessClientIds.length === 0) {
      return;
    }

    const awareness = document.getAwareness();

    /*
     * Filter to only client IDs that actually exist in the awareness meta.
     * A client ID may be tracked in the attachment but never have sent an
     * awareness message, so encoding an update for it would crash.
     */
    const knownClientIds = attachment.awarenessClientIds.filter((id) =>
      awareness.meta.has(id),
    );

    if (knownClientIds.length === 0) {
      return;
    }

    /*
     * Encode the removal update (passing a Map of clientId -> null) BEFORE
     * removing the states locally on the server.
     */
    const statesMap = new Map<number, any>();
    for (const id of knownClientIds) {
      statesMap.set(id, null);
    }

    const message = YjsProtocol.encodeAwarenessUpdate(
      awareness,
      knownClientIds,
      statesMap,
    );

    document.removeAwarenessStates(knownClientIds);

    this.broadcastBinary(ws, message);
  }

  private broadcastBinary(sender: WebSocket | null, data: Uint8Array): void {
    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== sender) {
        socket.send(data);
      }
    }
  }

  broadcastCommentEvent(event: CommentWsMessage): void {
    const data = JSON.stringify(event);

    for (const socket of this.ctx.getWebSockets()) {
      socket.send(data);
    }
  }

  private async broadcastMetadataChanges(
    metadata: UpdatePageMetadataInput,
  ): Promise<void> {
    if (!this.workspaceId || !this.pageId) {
      return;
    }

    const wsDoId = this.env.DOTION_WORKSPACE_DO.idFromName(this.workspaceId);
    const wsStub = this.env.DOTION_WORKSPACE_DO.get(wsDoId);
    const promises: Promise<void>[] = [];

    if (metadata.title !== undefined) {
      promises.push(
        wsStub.broadcastJSONToAll({
          type: "document.title.changed",
          payload: {
            id: this.pageId,
            workspaceId: this.workspaceId,
            title: metadata.title,
          },
        }),
      );
    }

    if (metadata.icon !== undefined) {
      promises.push(
        wsStub.broadcastJSONToAll({
          type: "document.icon.changed",
          payload: {
            id: this.pageId,
            workspaceId: this.workspaceId,
            icon: metadata.icon,
          },
        }),
      );
    }

    if (metadata.cover !== undefined) {
      promises.push(
        wsStub.broadcastJSONToAll({
          type: "document.cover.changed",
          payload: {
            id: this.pageId,
            workspaceId: this.workspaceId,
            cover: metadata.cover,
          },
        }),
      );
    }

    await Promise.all(promises);
  }

  async alarm(): Promise<void> {
    if (!this.document || !this.persistence) {
      const storedPageId = await this.ctx.storage.get<PageId>(STORAGE_PAGE_ID);
      const storedWorkspaceId =
        await this.ctx.storage.get<WorkspaceId>(STORAGE_WORKSPACE_ID);
      if (storedPageId) {
        await this.initialize(
          storedPageId,
          storedWorkspaceId ?? ("" as WorkspaceId),
        );
      }
    }

    if (this.persistence) {
      await this.persistence.persist(this.document);
    }
  }
}
