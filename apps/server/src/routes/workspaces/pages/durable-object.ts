import type { UserId } from "@dotion/shared/users/types";
import type {
  PageId,
  UpdatePageMetadataInput,
  AllPageRole,
} from "@dotion/shared/pages/types";
import type {
  WorkspaceId,
  WorkspaceWsMessage,
} from "@dotion/shared/workspaces/types";
import type { CommentWsMessage } from "@dotion/shared/comments/types";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import { PageClientWsMessageSchema } from "@dotion/shared/pages/schema";
import { DurableObject } from "cloudflare:workers";
import { PageDocument } from "./yjs/page-document";
import { PagePersistence } from "./yjs/page-persistence";
import {
  MSG_SYNC,
  MSG_AWARENESS,
  SYNC_STEP_1,
  SYNC_STEP_2,
  SYNC_UPDATE,
  WS_MSG_SYNC_STEP_1,
  WS_MSG_SYNC_STEP_2,
  WS_MSG_SYNC_UPDATE,
  WS_MSG_AWARENESS,
  YjsProtocol,
} from "./yjs/yjs-protocol";
import * as decoding from "lib0/decoding";
import { createAppContext } from "#/context";
import { WsRouter } from "#/lib/ws-router";
import type { PageWsAttachment, PageWsContext } from "./ws/types";
import {
  YjsSyncStep1Strategy,
  YjsSyncStep2Strategy,
  YjsSyncUpdateStrategy,
} from "./ws/strategies/yjs-sync.strategy";
import { YjsAwarenessStrategy } from "./ws/strategies/yjs-awareness.strategy";
import { PageMetadataUpdateStrategy } from "./ws/strategies/page-metadata.strategy";

const ROLE_PERMISSIONS_MAP: Record<AllPageRole, Set<PermissionKey>> = {
  editor: new Set(["page:view", "page:update", "comment:create"]),
  commenter: new Set(["page:view", "comment:create"]),
  viewer: new Set(["page:view"]),
};

const SYNC_STRATEGY_MAP: Record<number, string> = {
  [SYNC_STEP_1]: WS_MSG_SYNC_STEP_1,
  [SYNC_STEP_2]: WS_MSG_SYNC_STEP_2,
  [SYNC_UPDATE]: WS_MSG_SYNC_UPDATE,
};

const STORAGE_PAGE_ID = "pageId";
const STORAGE_WORKSPACE_ID = "workspaceId";

export class PagesDO extends DurableObject<Env> {
  private document: PageDocument | null = null;
  private persistence: PagePersistence | null = null;
  private initialization: Promise<PageDocument> | null = null;
  private pageId: PageId | null = null;
  private workspaceId: WorkspaceId | null = null;

  private readonly router = new WsRouter<PageWsContext>()
    .register(new YjsSyncStep1Strategy())
    .register(new YjsSyncStep2Strategy())
    .register(new YjsSyncUpdateStrategy())
    .register(new YjsAwarenessStrategy())
    .register(new PageMetadataUpdateStrategy());

  private async initialize(
    pageId?: PageId,
    workspaceId?: WorkspaceId,
  ): Promise<PageDocument> {
    if (this.document) {
      if (workspaceId && !this.workspaceId) {
        this.workspaceId = workspaceId;
        await this.ctx.storage.put(STORAGE_WORKSPACE_ID, workspaceId);
      }
      return this.document;
    }

    if (this.initialization) {
      return this.initialization;
    }

    this.initialization = (async () => {
      try {
        return await this.initializeInternal(pageId, workspaceId);
      } finally {
        this.initialization = null;
      }
    })();

    return await this.initialization;
  }

  private async initializeInternal(
    pageId?: PageId,
    workspaceId?: WorkspaceId,
  ): Promise<PageDocument> {
    const stored = await this.ctx.storage.get<string>([
      STORAGE_PAGE_ID,
      STORAGE_WORKSPACE_ID,
    ]);

    const storedPageId = (stored.get(STORAGE_PAGE_ID) as PageId) ?? null;
    const storedWorkspaceId =
      (stored.get(STORAGE_WORKSPACE_ID) as WorkspaceId) ?? null;

    const resolvedPageId = pageId ?? storedPageId;
    let resolvedWorkspaceId = workspaceId ?? storedWorkspaceId;

    if (!resolvedPageId) {
      throw new Error("PagesDO: missing pageId");
    }

    const { services } = createAppContext(this.env);

    if (!resolvedWorkspaceId) {
      const pageLookup = await services.pages.getPageById({
        pageId: resolvedPageId,
      });
      if (pageLookup.isOk()) {
        resolvedWorkspaceId = pageLookup.value.workspaceId;
      } else {
        console.error(
          `PagesDO: unrecoverable workspaceId for page ${resolvedPageId}:`,
          pageLookup.error,
        );
        await this.ctx.storage.deleteAlarm();
        throw new Error(
          `PagesDO: unrecoverable workspaceId for page ${resolvedPageId}`,
        );
      }
    }

    this.pageId = resolvedPageId;
    this.workspaceId = resolvedWorkspaceId;

    const updatesToPersist: Record<string, string> = {};
    if (!storedPageId) {
      updatesToPersist[STORAGE_PAGE_ID] = resolvedPageId;
    }
    if (!storedWorkspaceId) {
      updatesToPersist[STORAGE_WORKSPACE_ID] = resolvedWorkspaceId;
    }
    if (Object.keys(updatesToPersist).length > 0) {
      await this.ctx.storage.put(updatesToPersist);
    }

    const persistence = new PagePersistence({
      storage: this.ctx.storage,
      pagesService: services.pages,
      pageId: this.pageId,
      env: this.env,
      workspaceId: this.workspaceId,
    });

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

    try {
      await this.initialize(pageId, workspaceId);
    } catch (error: unknown) {
      console.error("PagesDO: failed to initialize document:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Failed to initialize document";

      return new Response(message, { status: 400 });
    }

    return this.acceptWebSocket(request);
  }

  private getPageIdFromRequest(request: Request): PageId {
    return request.headers.get("X-Page-Id") as PageId;
  }

  private getWorkspaceIdFromRequest(request: Request): WorkspaceId {
    return request.headers.get("X-Workspace-Id") as WorkspaceId;
  }

  private acceptWebSocket(request: Request): Response {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    const userIdHeader = request.headers.get("X-User-Id") as UserId;

    const permissionsHeader = request.headers.get("X-Permissions") ?? "";
    const permissions = new Set<PermissionKey>(
      permissionsHeader
        ? (permissionsHeader.split(",") as PermissionKey[])
        : [],
    );

    const attachment: PageWsAttachment = {
      userId: userIdHeader,
      userName: request.headers.get("X-User-Name") ?? "Anonymous",
      userColor: request.headers.get("X-User-Color") ?? "#808080",
      permissions,
      awarenessClientIds: [],
    };

    server.serializeAttachment(attachment);
    this.ctx.acceptWebSocket(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private createContext(
    ws: WebSocket,
    attachment: PageWsAttachment,
    document: PageDocument,
  ): PageWsContext {
    return {
      ws,
      userId: attachment.userId,
      userName: attachment.userName,
      document,
      persistence: this.persistence!,
      hasPermission: (permission) => attachment.permissions.has(permission),
      broadcastBinary: (data, excludeSender) => {
        this.broadcastBinary(data, excludeSender ? ws : null);
      },
      broadcastMetadata: async (payload) => {
        await this.broadcastMetadataChanges(payload);
      },
      onUnauthorized: () => {
        ws.send(YjsProtocol.encodeSyncStep1(document.getDoc()));
      },
      addAwarenessClientIds: (clientIds) => {
        this.addAwarenessClientIds(ws, clientIds);
      },
    };
  }

  async webSocketMessage(
    ws: WebSocket,
    message: ArrayBuffer | string,
  ): Promise<void> {
    let document: PageDocument;
    try {
      document = await this.initialize();
    } catch (error) {
      console.error(
        "PagesDO: failed to initialize document on message:",
        error,
      );
      ws.close(1011, "Initialization failed");
      return;
    }

    const attachment = ws.deserializeAttachment() as PageWsAttachment;
    const ctx = this.createContext(ws, attachment, document);

    if (typeof message === "string") {
      await this.handleStringMessage(ctx, message);
    } else {
      await this.handleBinaryMessage(ctx, new Uint8Array(message));
    }
  }

  private async handleStringMessage(
    ctx: PageWsContext,
    message: string,
  ): Promise<void> {
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
      await this.router.dispatch(ctx, parsed.data.type, parsed.data.payload);
    } catch (error) {
      console.error("PagesDO: error handling string WS message:", error);
    }
  }

  private async handleBinaryMessage(
    ctx: PageWsContext,
    data: Uint8Array,
  ): Promise<void> {
    const decoder = decoding.createDecoder(data);
    const messageType = decoding.readVarUint(decoder);

    if (messageType === MSG_SYNC) {
      const syncType = decoding.peekVarUint(decoder);
      const strategyKey = SYNC_STRATEGY_MAP[syncType];

      if (strategyKey) {
        await this.router.dispatch(ctx, strategyKey, {
          syncType,
          syncDecoder: decoder,
          rawData: data,
        });
      } else {
        console.warn(`PagesDO: unhandled sync message subtype ${syncType}`);
      }
    } else if (messageType === MSG_AWARENESS) {
      await this.router.dispatch(ctx, WS_MSG_AWARENESS, { decoder });
    } else {
      console.warn(`PagesDO: unhandled binary message type ${messageType}`);
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    if (!this.document) {
      try {
        await this.initialize();
      } catch (error) {
        console.error(
          "PagesDO: failed to initialize document on close:",
          error,
        );
      }
    }

    if (this.document) {
      this.removeConnectionAwareness(ws);
    }

    const remaining = this.ctx.getWebSockets();
    if (remaining.length === 0 && this.persistence && this.document) {
      await this.persistence.persistImmediately(this.document).catch((err) => {
        console.error("PagesDO: failed to persist immediately on close:", err);
      });
    }
  }

  async webSocketError(_ws: WebSocket, error: unknown): Promise<void> {
    console.error("PagesDO: WebSocket error:", error);
  }

  private addAwarenessClientIds(ws: WebSocket, clientIds: number[]): void {
    const attachment = ws.deserializeAttachment() as PageWsAttachment | null;
    if (!attachment) {
      return;
    }

    const ids = new Set(attachment.awarenessClientIds);
    let changed = false;
    for (const clientId of clientIds) {
      if (!ids.has(clientId)) {
        ids.add(clientId);
        changed = true;
      }
    }

    if (changed) {
      attachment.awarenessClientIds = Array.from(ids);
      ws.serializeAttachment(attachment);
    }
  }

  private removeConnectionAwareness(ws: WebSocket): void {
    if (!this.document) return;

    const attachment = ws.deserializeAttachment() as PageWsAttachment | null;
    if (!attachment || attachment.awarenessClientIds.length === 0) {
      return;
    }

    const awareness = this.document.getAwareness();
    const knownClientIds = attachment.awarenessClientIds.filter((id) =>
      awareness.meta.has(id),
    );

    if (knownClientIds.length === 0) {
      return;
    }

    const statesMap = new Map<number, null>();
    for (const id of knownClientIds) {
      statesMap.set(id, null);
    }

    const message = YjsProtocol.encodeAwarenessUpdate(
      awareness,
      knownClientIds,
      statesMap,
    );

    this.document.removeAwarenessStates(knownClientIds);
    this.broadcastBinary(message, ws);
  }

  private broadcastBinary(
    data: Uint8Array,
    excludeSender?: WebSocket | null,
  ): void {
    for (const socket of this.ctx.getWebSockets()) {
      if (socket !== excludeSender) {
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

  updateUserRole(userId: UserId, role: AllPageRole): void {
    const permissions =
      ROLE_PERMISSIONS_MAP[role] ?? new Set<PermissionKey>([]);
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = ws.deserializeAttachment() as PageWsAttachment | null;
      if (attachment && attachment.userId === userId) {
        attachment.permissions = permissions;
        ws.serializeAttachment(attachment);
      }
    }
  }

  disconnectUser(userId: UserId, reason = "Permission revoked"): void {
    for (const ws of this.ctx.getWebSockets()) {
      const attachment = ws.deserializeAttachment() as PageWsAttachment | null;
      if (attachment && attachment.userId === userId) {
        ws.close(4403, reason);
      }
    }
  }

  private async broadcastMetadataChanges(
    metadata: UpdatePageMetadataInput,
  ): Promise<void> {
    if (!this.workspaceId || !this.pageId) {
      return;
    }

    const { pageId, workspaceId } = this;
    const messages: WorkspaceWsMessage[] = [];

    if (metadata.title !== undefined) {
      messages.push({
        type: "document.title.changed",
        payload: { id: pageId, workspaceId, title: metadata.title },
      });
    }
    if (metadata.icon !== undefined) {
      messages.push({
        type: "document.icon.changed",
        payload: { id: pageId, workspaceId, icon: metadata.icon },
      });
    }
    if (metadata.cover !== undefined) {
      messages.push({
        type: "document.cover.changed",
        payload: { id: pageId, workspaceId, cover: metadata.cover },
      });
    }

    if (messages.length === 0) {
      return;
    }

    const wsDoId = this.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
    const wsStub = this.env.DOTION_WORKSPACE_DO.get(wsDoId);

    await Promise.all(
      messages.map((message) => wsStub.broadcastJSONToAll(message)),
    );
  }

  async alarm(): Promise<void> {
    if (!this.document || !this.persistence) {
      await this.initialize();
    }

    if (this.persistence && this.document) {
      await this.persistence.persist(this.document);
    }
  }
}
