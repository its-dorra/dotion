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

export type YjsProtocolResult = {
  reply?: Uint8Array;
  broadcastData?: Uint8Array;
  awarenessClientIds?: number[];
};

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

  static handleMessage(
    data: Uint8Array,
    doc: Y.Doc,
    awareness: awarenessProtocol.Awareness,
    origin: unknown,
  ): YjsProtocolResult {
    const decoder = decoding.createDecoder(data);

    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case MSG_SYNC:
        return this.handleSyncMessage(data, doc);

      case MSG_AWARENESS:
        return this.handleAwarenessMessage(decoder, awareness, origin);

      default:
        console.warn(`YjsProtocol: unknown message type ${messageType}`);

        return {};
    }
  }

  private static handleSyncMessage(
    data: Uint8Array,
    doc: Y.Doc,
  ): YjsProtocolResult {
    const typeDecoder = decoding.createDecoder(data);

    decoding.readVarUint(typeDecoder);

    const syncType = decoding.readVarUint(typeDecoder);

    const syncDecoder = decoding.createDecoder(data);

    decoding.readVarUint(syncDecoder);

    const responseEncoder = encoding.createEncoder();

    syncProtocol.readSyncMessage(syncDecoder, responseEncoder, doc, null);

    if (syncType === SYNC_STEP_1 || syncType === SYNC_STEP_2) {
      if (encoding.length(responseEncoder) <= 0) {
        return {};
      }

      const outerEncoder = encoding.createEncoder();

      encoding.writeVarUint(outerEncoder, MSG_SYNC);

      encoding.writeUint8Array(
        outerEncoder,
        encoding.toUint8Array(responseEncoder),
      );

      return {
        reply: encoding.toUint8Array(outerEncoder),
      };
    }

    if (syncType === SYNC_UPDATE) {
      return {
        broadcastData: data,
      };
    }

    console.warn(`YjsProtocol: unknown sync message type ${syncType}`);

    return {};
  }

  private static handleAwarenessMessage(
    decoder: decoding.Decoder,
    awareness: awarenessProtocol.Awareness,
    origin: unknown,
  ): YjsProtocolResult {
    const update = decoding.readVarUint8Array(decoder);

    const clientIds = this.getAwarenessClientIds(update);

    awarenessProtocol.applyAwarenessUpdate(awareness, update, origin);

    const encoder = encoding.createEncoder();

    encoding.writeVarUint(encoder, MSG_AWARENESS);

    encoding.writeVarUint8Array(encoder, update);

    return {
      broadcastData: encoding.toUint8Array(encoder),
      awarenessClientIds: clientIds,
    };
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
