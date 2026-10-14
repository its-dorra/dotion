import type { BaseWsContext } from "#/lib/ws-router";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import type { UserId } from "@dotion/shared/users/types";
import type { UpdatePageMetadataInput } from "@dotion/shared/pages/types";
import type { PageDocument } from "../yjs/page-document";
import type { PagePersistence } from "../yjs/page-persistence";

export interface PageWsAttachment {
  userId: UserId;
  userName: string;
  userColor: string;
  permissions: Set<PermissionKey>;
  awarenessClientIds: number[];
}

export interface PageWsContext extends BaseWsContext {
  readonly userName: string;
  readonly document: PageDocument;
  readonly persistence: PagePersistence | null;
  broadcastBinary(data: Uint8Array, excludeSender: boolean): void;
  broadcastMetadata(payload: UpdatePageMetadataInput): Promise<void>;
  addAwarenessClientIds(clientIds: number[]): void;
}
