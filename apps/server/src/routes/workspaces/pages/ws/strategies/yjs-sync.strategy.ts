import type { WsStrategy } from "#/lib/ws-router";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import type { PageWsContext } from "../types";
import * as syncProtocol from "y-protocols/sync";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import {
  MSG_SYNC,
  WS_MSG_SYNC_STEP_1,
  WS_MSG_SYNC_STEP_2,
  WS_MSG_SYNC_UPDATE,
} from "../../yjs/yjs-protocol";

export interface YjsSyncPayload {
  readonly syncType: number;
  readonly syncDecoder: decoding.Decoder;
  readonly rawData: Uint8Array;
}

function handleSyncReply(ctx: PageWsContext, payload: YjsSyncPayload): void {
  const responseEncoder = encoding.createEncoder();
  syncProtocol.readSyncMessage(
    payload.syncDecoder,
    responseEncoder,
    ctx.document.getDoc(),
    null,
  );

  if (encoding.length(responseEncoder) > 0) {
    const outerEncoder = encoding.createEncoder();
    encoding.writeVarUint(outerEncoder, MSG_SYNC);
    encoding.writeUint8Array(
      outerEncoder,
      encoding.toUint8Array(responseEncoder),
    );
    ctx.ws.send(encoding.toUint8Array(outerEncoder));
  }
}

export class YjsSyncStep1Strategy implements WsStrategy<
  PageWsContext,
  YjsSyncPayload
> {
  readonly messageType = WS_MSG_SYNC_STEP_1;
  readonly requiredPermission: PermissionKey = "page:view";

  handle(ctx: PageWsContext, payload: YjsSyncPayload): void {
    handleSyncReply(ctx, payload);
  }
}

export class YjsSyncStep2Strategy implements WsStrategy<
  PageWsContext,
  YjsSyncPayload
> {
  readonly messageType = WS_MSG_SYNC_STEP_2;
  readonly requiredPermission: PermissionKey = "page:view";

  handle(ctx: PageWsContext, payload: YjsSyncPayload): void {
    handleSyncReply(ctx, payload);
  }
}

export class YjsSyncUpdateStrategy implements WsStrategy<
  PageWsContext,
  YjsSyncPayload
> {
  readonly messageType = WS_MSG_SYNC_UPDATE;
  readonly requiredPermission: PermissionKey = "page:update";

  handle(ctx: PageWsContext, payload: YjsSyncPayload): void {
    const responseEncoder = encoding.createEncoder();
    syncProtocol.readSyncMessage(
      payload.syncDecoder,
      responseEncoder,
      ctx.document.getDoc(),
      null,
    );
    ctx.broadcastBinary(payload.rawData, true);
  }
}
