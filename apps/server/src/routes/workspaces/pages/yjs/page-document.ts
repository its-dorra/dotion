import * as Y from "yjs";
import * as awarenessProtocol from "y-protocols/awareness";

const LOAD_ORIGIN = Symbol("load");

export class PageDocument {
  private readonly doc: Y.Doc;
  private readonly awareness: awarenessProtocol.Awareness;

  private revision = 0;
  private dirty = false;

  private onUpdateCallback: (() => void) | undefined;

  constructor() {
    this.doc = new Y.Doc();
    this.awareness = new awarenessProtocol.Awareness(this.doc);

    this.doc.on("update", (_update, origin) => {
      if (origin === LOAD_ORIGIN) return;
      this.revision += 1;
      this.dirty = true;
      this.onUpdateCallback?.();
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
    Y.applyUpdate(this.doc, state, LOAD_ORIGIN);
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

  markDirty(): void {
    this.dirty = true;
  }

  markPersisted(persistedRevision: number): boolean {
    if (this.revision !== persistedRevision) {
      return false;
    }

    this.dirty = false;
    return true;
  }

  removeAwarenessStates(clientIds: number[]): void {
    awarenessProtocol.removeAwarenessStates(
      this.awareness,
      clientIds,
      "disconnect",
    );
  }
}
