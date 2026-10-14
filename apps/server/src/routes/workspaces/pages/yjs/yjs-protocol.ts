import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";

import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

export const MSG_SYNC = 0;
export const MSG_AWARENESS = 1;

export const SYNC_STEP_1 = 0;
export const SYNC_STEP_2 = 1;
export const SYNC_UPDATE = 2;

export const WS_MSG_SYNC_STEP_1 = "yjs:sync:step1";
export const WS_MSG_SYNC_STEP_2 = "yjs:sync:step2";
export const WS_MSG_SYNC_UPDATE = "yjs:sync:update";
export const WS_MSG_AWARENESS = "yjs:awareness";

export class YjsProtocol {
  static encodeSyncStep1(doc: Y.Doc): Uint8Array {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeSyncStep1(encoder, doc);
    return encoding.toUint8Array(encoder);
  }

  static encodeAwarenessUpdate(
    awareness: awarenessProtocol.Awareness,
    clientIds: number[],
    states?: Map<number, any>,
  ): Uint8Array {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_AWARENESS);
    const update = awarenessProtocol.encodeAwarenessUpdate(
      awareness,
      clientIds,
      states,
    );
    encoding.writeVarUint8Array(encoder, update);
    return encoding.toUint8Array(encoder);
  }

  static getAwarenessClientIds(update: Uint8Array): number[] {
    const decoder = decoding.createDecoder(update);
    const count = decoding.readVarUint(decoder);
    const clientIds: number[] = [];

    for (let i = 0; i < count; i++) {
      const clientId = decoding.readVarUint(decoder);
      decoding.readVarUint(decoder);
      decoding.readVarString(decoder);
      clientIds.push(clientId);
    }

    return clientIds;
  }
}
