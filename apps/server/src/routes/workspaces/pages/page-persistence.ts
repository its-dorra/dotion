import type { PagesService } from "@dotion/services";
import type { PageDocument } from "./page-document";
import type {
  Page,
  PageId,
  UpdatePageMetadataInput,
} from "@dotion/shared/pages/types";
import type { PageIndexingQueueMessage } from "@dotion/shared/search/types";

const STORAGE_YJS_STATE = "yjs-state";
const STORAGE_PENDING_METADATA = "pending-metadata";

/**
 * Persistence timing strategy:
 * 1. DO Local Storage: Saved immediately on every document update (sub-millisecond local SQLite/KV).
 * 2. Page Metadata (Title, Icon, Cover): Flushed to PostgreSQL on a short 2s debounce for fast sidebar/page tree sync.
 * 3. Page Content (Yjs CRDT): Flushed to PostgreSQL on a relaxed interval (30s active checkpoint or 10s idle debounce),
 *    plus flushed immediately when the last client disconnects.
 */
const METADATA_DEBOUNCE_MS = 2_000;
const CONTENT_IDLE_DEBOUNCE_MS = 10_000;
const CONTENT_MAX_CHECKPOINT_MS = 30_000;

export interface PersistResult {
  persistedMetadata: UpdatePageMetadataInput | null;
  page: Page | null;
}

export class PagePersistence {
  private persistPromise: Promise<PersistResult> | null = null;
  private lastContentEditTime = 0;
  private firstUnpersistedContentEditTime = 0;
  private lastMetadataEditTime = 0;

  constructor(
    private readonly storage: DurableObjectStorage,
    private readonly pagesService: PagesService,
    private readonly pageId: PageId,
    private readonly env?: Env,
  ) {}

  async loadInitialState(): Promise<Uint8Array | null> {
    const storedState = await this.storage.get<Uint8Array>(STORAGE_YJS_STATE);

    if (storedState) {
      return storedState;
    }

    const result = await this.pagesService.getPageContent(this.pageId);

    if (!result.isOk()) {
      throw result.error;
    }

    const state = result.value;

    if (!state) {
      return null;
    }

    await this.storage.put(STORAGE_YJS_STATE, state);

    return state;
  }

  async onDocumentUpdate(document: PageDocument): Promise<void> {
    const now = Date.now();
    this.lastContentEditTime = now;
    if (!this.firstUnpersistedContentEditTime) {
      this.firstUnpersistedContentEditTime = now;
    }

    // Tier 1: Immediately persist latest state to local DO storage
    try {
      const state = document.encodeState();
      await this.storage.put(STORAGE_YJS_STATE, state);
    } catch (error) {
      console.error(
        `PagePersistence: failed to write page ${this.pageId} state to DO storage:`,
        error,
      );
    }

    await this.recalculateAndScheduleAlarm(document);
  }

  async queueMetadataUpdate(
    update: UpdatePageMetadataInput,
    document?: PageDocument | null,
  ): Promise<void> {
    const existing =
      (await this.storage.get<UpdatePageMetadataInput>(
        STORAGE_PENDING_METADATA,
      )) || {};

    const merged: UpdatePageMetadataInput = {
      ...existing,
      ...(update.title !== undefined ? { title: update.title } : {}),
      ...(update.icon !== undefined ? { icon: update.icon } : {}),
      ...(update.cover !== undefined ? { cover: update.cover } : {}),
    };

    this.lastMetadataEditTime = Date.now();
    await this.storage.put(STORAGE_PENDING_METADATA, merged);
    await this.recalculateAndScheduleAlarm(document ?? null);
  }

  async schedulePersist(): Promise<void> {
    await this.storage.setAlarm(Date.now() + METADATA_DEBOUNCE_MS);
  }

  async persist(document: PageDocument | null): Promise<PersistResult> {
    return await this.persistInternal(document, false);
  }

  async persistImmediately(
    document: PageDocument | null,
  ): Promise<PersistResult> {
    await this.storage.deleteAlarm();
    return await this.persistInternal(document, true);
  }

  private async persistInternal(
    document: PageDocument | null,
    forceFlushAll: boolean,
  ): Promise<PersistResult> {
    if (this.persistPromise) {
      return await this.persistPromise;
    }

    this.persistPromise = this.persistInternalUnsafe(document, forceFlushAll);

    try {
      return await this.persistPromise;
    } finally {
      this.persistPromise = null;
    }
  }

  private async persistInternalUnsafe(
    document: PageDocument | null,
    forceFlushAll: boolean,
  ): Promise<PersistResult> {
    const result: PersistResult = {
      persistedMetadata: null,
      page: null,
    };

    const now = Date.now();
    let hasError = false;

    // 1. Check & persist metadata if pending and ready
    const pendingMetadata = await this.storage.get<UpdatePageMetadataInput>(
      STORAGE_PENDING_METADATA,
    );

    const isMetadataReady =
      pendingMetadata &&
      Object.keys(pendingMetadata).length > 0 &&
      (forceFlushAll ||
        now >= this.lastMetadataEditTime + METADATA_DEBOUNCE_MS);

    if (isMetadataReady) {
      try {
        const metadataResult = await this.pagesService.updatePageMetadata(
          this.pageId,
          pendingMetadata,
        );

        if (!metadataResult.isOk()) {
          console.error(
            "PagePersistence: failed to persist page metadata to PostgreSQL:",
            metadataResult.error,
          );
          hasError = true;
        } else {
          const currentStorage =
            await this.storage.get<UpdatePageMetadataInput>(
              STORAGE_PENDING_METADATA,
            );
          if (currentStorage) {
            const remaining: UpdatePageMetadataInput = { ...currentStorage };
            if (
              pendingMetadata.title !== undefined &&
              remaining.title === pendingMetadata.title
            ) {
              delete remaining.title;
            }
            if (
              pendingMetadata.icon !== undefined &&
              remaining.icon === pendingMetadata.icon
            ) {
              delete remaining.icon;
            }
            if (
              pendingMetadata.cover !== undefined &&
              remaining.cover === pendingMetadata.cover
            ) {
              delete remaining.cover;
            }

            if (Object.keys(remaining).length === 0) {
              await this.storage.delete(STORAGE_PENDING_METADATA);
              this.lastMetadataEditTime = 0;
            } else {
              await this.storage.put(STORAGE_PENDING_METADATA, remaining);
            }
          }
          result.persistedMetadata = pendingMetadata;
          result.page = metadataResult.value;
          console.log(
            `PagePersistence: persisted page ${this.pageId} metadata:`,
            pendingMetadata,
          );
        }
      } catch (error) {
        console.error(
          `PagePersistence: failed to persist page ${this.pageId} metadata:`,
          error,
        );
        hasError = true;
      }
    }

    // 2. Check & persist Yjs content if dirty and ready
    const isContentDirty = document && document.isDirty();
    const isContentReady =
      isContentDirty &&
      (forceFlushAll ||
        now >= this.lastContentEditTime + CONTENT_IDLE_DEBOUNCE_MS ||
        now >=
          this.firstUnpersistedContentEditTime + CONTENT_MAX_CHECKPOINT_MS);

    if (isContentReady && document) {
      const revision = document.getRevision();
      const state = document.encodeState();

      try {
        // Ensure DO local storage is updated
        await this.storage.put(STORAGE_YJS_STATE, state);

        const updateResult = await this.pagesService.updatePageContent(
          this.pageId,
          state,
        );

        if (!updateResult.isOk()) {
          console.error(
            "PagePersistence: failed to persist page content to PostgreSQL:",
            updateResult.error,
          );
          hasError = true;
        } else {
          const persistedLatestRevision = document.markPersisted(revision);
          if (persistedLatestRevision) {
            this.firstUnpersistedContentEditTime = 0;
            this.lastContentEditTime = 0;
          }
          console.log(
            `PagePersistence: persisted page ${this.pageId} content at revision ${revision}.`,
          );

          // Enqueue asynchronous background indexing job
          if (this.env?.PAGE_INDEXING_QUEUE) {
            try {
              const pageLookup = await this.pagesService.getPageById(
                this.pageId,
              );
              if (pageLookup.isOk()) {
                const message: PageIndexingQueueMessage = {
                  workspaceId: pageLookup.value.workspaceId,
                  pageId: this.pageId,
                  version: revision,
                };
                await this.env.PAGE_INDEXING_QUEUE.send(message);
              }
            } catch (err) {
              console.error(
                "PagePersistence: failed to enqueue page indexing job:",
                err,
              );
            }
          }
        }
      } catch (error) {
        console.error(
          `PagePersistence: failed to persist page ${this.pageId} content:`,
          error,
        );
        hasError = true;
      }
    }

    if (forceFlushAll) {
      if (hasError) {
        // Schedule retry alarm if flush had errors
        await this.storage.setAlarm(Date.now() + 5_000);
      } else {
        await this.storage.deleteAlarm();
      }
    } else {
      await this.recalculateAndScheduleAlarm(document, hasError);
    }

    return result;
  }

  private async recalculateAndScheduleAlarm(
    document: PageDocument | null,
    retryOnError = false,
  ): Promise<void> {
    const deadlines: number[] = [];
    const now = Date.now();

    if (retryOnError) {
      deadlines.push(now + 5_000);
    }

    // Check pending metadata deadline
    const pendingMetadata = await this.storage.get<UpdatePageMetadataInput>(
      STORAGE_PENDING_METADATA,
    );
    if (pendingMetadata && Object.keys(pendingMetadata).length > 0) {
      const metadataDeadline =
        (this.lastMetadataEditTime || now) + METADATA_DEBOUNCE_MS;
      deadlines.push(metadataDeadline);
    }

    // Check content checkpoint deadline
    if (document && document.isDirty()) {
      const idleDeadline =
        (this.lastContentEditTime || now) + CONTENT_IDLE_DEBOUNCE_MS;
      const maxCheckpointDeadline =
        (this.firstUnpersistedContentEditTime || now) +
        CONTENT_MAX_CHECKPOINT_MS;
      deadlines.push(Math.min(idleDeadline, maxCheckpointDeadline));
    }

    if (deadlines.length > 0) {
      const earliest = Math.min(...deadlines);
      // setAlarm with a timestamp in the past triggers almost immediately
      await this.storage.setAlarm(Math.max(earliest, now + 50));
    } else {
      await this.storage.deleteAlarm();
    }
  }
}
