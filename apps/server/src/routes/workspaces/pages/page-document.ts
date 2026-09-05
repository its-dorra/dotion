import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";

export class PageDocument {
  private readonly doc: Y.Doc;
  private readonly awareness: awarenessProtocol.Awareness;

  private revision = 0;
  private dirty = false;

  private isLoading = false;

  private onUpdateCallback: (() => void) | undefined;

  constructor() {
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);

    /*
     * This listener is installed before hydration, so hydration must happen
     * through load() which temporarily suppresses persistence tracking.
     */
    this.doc.on("update", () => {
      if (!this.isLoading) {
        this.revision += 1;
        this.dirty = true;
        this.onUpdateCallback?.();
      }
    });
  }

  getDoc(): Y.Doc {
    return this.doc;
  }

  getAwareness(): awarenessProtocol.Awareness {
    return this.awareness;
  }

  onUpdate(callback: () => void): void {
    this.onUpdateCallback = callback;
  }

  load(state: Uint8Array): void {
    this.isLoading = true;

    try {
      this.applyUpdate(state);
    } finally {
      this.isLoading = false;
    }
  }

  applyUpdate(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update);
  }

  applyAwarenessUpdate(update: Uint8Array, origin: unknown): void {
    awarenessProtocol.applyAwarenessUpdate(this.awareness, update, origin);
  }

  encodeState(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  getRevision(): number {
    return this.revision;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  /**
   * Only marks the document clean if the revision that was persisted is still
   * the current revision.
   *
   * If another edit happened during persistence, dirty remains true.
   */
  markPersisted(persistedRevision: number): boolean {
    if (this.revision !== persistedRevision) {
      return false;
    }

    this.dirty = false;
    return true;
  }

  /**
   * Returns whether there are changes newer than the supplied revision.
   */
  hasChangedSince(revision: number): boolean {
    return this.revision !== revision;
  }

  /**
   * Remove awareness states belonging to a disconnected WebSocket.
   */
  removeAwarenessStates(clientIds: number[]): void {
    if (clientIds.length === 0) {
      return;
    }

    awarenessProtocol.removeAwarenessStates(
      this.awareness,
      clientIds,
      "disconnect",
    );
  }

  /**
   * Encode awareness states for the supplied client IDs.
   */
  encodeAwarenessStates(clientIds: number[]): Uint8Array {
    return awarenessProtocol.encodeAwarenessUpdate(this.awareness, clientIds);
  }

  getAwarenessStates(): Map<number, unknown> {
    return this.awareness.getStates();
  }
}
