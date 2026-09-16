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
    /*
     * We need to inspect the sync subtype without consuming the decoder
     * that is passed to y-protocols.
     */
    const typeDecoder = decoding.createDecoder(data);

    /*
     * Outer message type.
     */
    decoding.readVarUint(typeDecoder);

    const syncType = decoding.readVarUint(typeDecoder);

    /*
     * Create the decoder that y-protocols expects.
     *
     * It must start AFTER the outer MSG_SYNC value, because
     * readSyncMessage expects to read the sync subtype itself.
     */
    const syncDecoder = decoding.createDecoder(data);

    decoding.readVarUint(syncDecoder);

    const responseEncoder = encoding.createEncoder();

    /*
     * y-protocols writes the sync subtype + payload into this encoder.
     */
    syncProtocol.readSyncMessage(syncDecoder, responseEncoder, doc, null);

    /*
     * SyncStep1 and SyncStep2 are handshake messages.
     *
     * They must only be sent back to the sender.
     */
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

    /*
     * Actual document update.
     *
     * readSyncMessage already applied it to the Y.Doc.
     *
     * Broadcast the original message unchanged to all other clients.
     */
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

    /*
     * Reconstruct the complete protocol message for broadcasting.
     */
    const encoder = encoding.createEncoder();

    encoding.writeVarUint(encoder, MSG_AWARENESS);

    encoding.writeVarUint8Array(encoder, update);

    return {
      broadcastData: encoding.toUint8Array(encoder),
      awarenessClientIds: clientIds,
    };
  }

  /**
   * Extract the Yjs awareness client IDs from an awareness update.
   */
  static getAwarenessClientIds(update: Uint8Array): number[] {
    const decoder = decoding.createDecoder(update);

    const count = decoding.readVarUint(decoder);

    const clientIds: number[] = [];

    for (let i = 0; i < count; i++) {
      const clientId = decoding.readVarUint(decoder);

      /*
       * Awareness clock.
       */
      decoding.readVarUint(decoder);

      /*
       * JSON encoded awareness state.
       */
      decoding.readVarString(decoder);

      clientIds.push(clientId);
    }

    return clientIds;
  }
}
