import type { WsStrategy } from "#/lib/ws-router";
import type { PermissionKey } from "@dotion/shared/authorization/types";
import type { PageWsContext } from "../types";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";
import { MSG_AWARENESS, YjsProtocol } from "../../yjs-protocol";

export interface YjsAwarenessPayload {
  readonly decoder: decoding.Decoder;
}

export class YjsAwarenessStrategy implements WsStrategy<
  PageWsContext,
  YjsAwarenessPayload
> {
  readonly messageType = MSG_AWARENESS;
  readonly requiredPermission: PermissionKey = "page:view";

  handle(ctx: PageWsContext, payload: YjsAwarenessPayload): void {
    const update = decoding.readVarUint8Array(payload.decoder);
    const clientIds = YjsProtocol.getAwarenessClientIds(update);

    awarenessProtocol.applyAwarenessUpdate(
      ctx.document.getAwareness(),
      update,
      ctx.ws,
    );

    if (clientIds.length > 0) {
      ctx.addAwarenessClientIds(clientIds);
    }

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_AWARENESS);
    encoding.writeVarUint8Array(encoder, update);
    ctx.broadcastBinary(encoding.toUint8Array(encoder), true);
  }
}
