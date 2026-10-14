import type { PagesService } from "@dotion/services";
import type { PageDocument } from "./page-document";
import type {
  PageId,
  UpdatePageMetadataInput,
} from "@dotion/shared/pages/types";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { PageIndexingQueueMessage } from "@dotion/shared/search/types";

const STORAGE_YJS_STATE = "yjs-state";
const STORAGE_PENDING_METADATA = "pending-metadata";
const STORAGE_CONTENT_DIRTY = "content-dirty";

const METADATA_DEBOUNCE_MS = 2_000;
const CONTENT_IDLE_DEBOUNCE_MS = 10_000;
const CONTENT_MAX_CHECKPOINT_MS = 30_000;

export interface PagePersistenceOptions {
  storage: DurableObjectStorage;
  pagesService: PagesService;
  pageId: PageId;
  env: Env;
  workspaceId?: WorkspaceId | null;
}

export class PagePersistence {
  private readonly storage: DurableObjectStorage;
  private readonly pagesService: PagesService;
  private readonly pageId: PageId;
  private readonly env: Env;
  private workspaceId: WorkspaceId | null = null;

  private persistPromise: Promise<boolean> | null = null;
  private pendingForceFlush = false;
  private lastContentEditTime = 0;
  private firstUnpersistedContentEditTime = 0;
  private lastMetadataEditTime = 0;

  private pendingMetadata: UpdatePageMetadataInput | null = null;
  private metadataVersion = 0;

  constructor({
    storage,
    pagesService,
    pageId,
    env,
    workspaceId,
  }: PagePersistenceOptions) {
    this.storage = storage;
    this.pagesService = pagesService;
    this.pageId = pageId;
    this.env = env;
    this.workspaceId = workspaceId ?? null;
  }

  async loadInitialState(document: PageDocument): Promise<Uint8Array | null> {
    const stored = await this.storage.get<
      Uint8Array | boolean | UpdatePageMetadataInput
    >([STORAGE_YJS_STATE, STORAGE_CONTENT_DIRTY, STORAGE_PENDING_METADATA]);

    const storedState = (stored.get(STORAGE_YJS_STATE) as Uint8Array) ?? null;
    const isDirty = (stored.get(STORAGE_CONTENT_DIRTY) as boolean) ?? false;
    this.pendingMetadata =
      (stored.get(STORAGE_PENDING_METADATA) as UpdatePageMetadataInput) ?? null;

    if (isDirty) {
      document.markDirty();
    }

    if (storedState) {
      return storedState;
    }

    const result = await this.pagesService.getPageContent({
      pageId: this.pageId,
    });

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

    try {
      const state = document.encodeState();
      await this.storage.put({
        [STORAGE_YJS_STATE]: state,
        [STORAGE_CONTENT_DIRTY]: true,
      });
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
    document: PageDocument,
  ): Promise<void> {
    const existing = this.pendingMetadata ?? {};

    const merged: UpdatePageMetadataInput = {
      ...existing,
      ...(update.title !== undefined ? { title: update.title } : {}),
      ...(update.icon !== undefined ? { icon: update.icon } : {}),
      ...(update.cover !== undefined ? { cover: update.cover } : {}),
    };

    this.pendingMetadata = merged;
    this.lastMetadataEditTime = Date.now();
    this.metadataVersion += 1;
    await this.storage.put(STORAGE_PENDING_METADATA, merged);
    await this.recalculateAndScheduleAlarm(document);
  }

  async persist(document: PageDocument): Promise<boolean> {
    return await this.persistInternal(document, false);
  }

  async persistImmediately(document: PageDocument): Promise<boolean> {
    this.pendingForceFlush = true;
    await this.storage.deleteAlarm();
    return await this.persistInternal(document, true);
  }

  private async persistInternal(
    document: PageDocument,
    forceFlushAll: boolean,
  ): Promise<boolean> {
    if (forceFlushAll) {
      this.pendingForceFlush = true;
    }

    if (this.persistPromise) {
      return await this.persistPromise;
    }

    this.persistPromise = (async () => {
      let allOk = true;
      try {
        while (true) {
          const force = this.pendingForceFlush || forceFlushAll;
          this.pendingForceFlush = false;
          const success = await this.persistInternalUnsafe(document, force);
          if (!success) {
            allOk = false;
          }
          if (!this.pendingForceFlush) {
            break;
          }
        }
        return allOk;
      } finally {
        this.persistPromise = null;
      }
    })();

    return await this.persistPromise;
  }

  private async resolveWorkspaceId(): Promise<WorkspaceId | null> {
    if (this.workspaceId) {
      return this.workspaceId;
    }

    const pageLookup = await this.pagesService.getPageById({
      pageId: this.pageId,
    });
    if (pageLookup.isOk()) {
      this.workspaceId = pageLookup.value.workspaceId;
      return this.workspaceId;
    }

    return null;
  }

  private async enqueueIndexing(
    workspaceId: WorkspaceId,
    version?: number,
  ): Promise<void> {
    if (!this.env.PAGE_INDEXING_QUEUE) {
      return;
    }

    try {
      const message: PageIndexingQueueMessage = {
        workspaceId,
        pageId: this.pageId,
        ...(version !== undefined ? { version } : {}),
      };
      await this.env.PAGE_INDEXING_QUEUE.send(message);
    } catch (err) {
      console.warn(
        "PagePersistence: fast-path queue send failed (will be caught by outbox poller):",
        err,
      );
    }
  }

  private async flushMetadata(
    targetWorkspaceId: WorkspaceId | null,
    forceFlushAll: boolean,
  ): Promise<{ hasError: boolean }> {
    const pendingMetadata = this.pendingMetadata;

    const now = Date.now();
    const isReady =
      pendingMetadata &&
      Object.keys(pendingMetadata).length > 0 &&
      (forceFlushAll ||
        this.lastMetadataEditTime === 0 ||
        now + 100 >= this.lastMetadataEditTime + METADATA_DEBOUNCE_MS);

    if (!isReady || !pendingMetadata) {
      return { hasError: false };
    }

    const versionAtStart = this.metadataVersion;
    const snapshot = { ...pendingMetadata };

    try {
      const metadataResult =
        targetWorkspaceId && snapshot.title !== undefined
          ? await this.pagesService.updatePageMetadataWithOutbox({
              pageId: this.pageId,
              data: snapshot,
              workspaceId: targetWorkspaceId,
            })
          : await this.pagesService.updatePageMetadata({
              pageId: this.pageId,
              data: snapshot,
            });

      if (!metadataResult.isOk()) {
        console.error(
          "PagePersistence: failed to persist page metadata to PostgreSQL:",
          metadataResult.error,
        );
        return { hasError: true };
      }

      if (this.metadataVersion === versionAtStart) {
        await this.storage.delete(STORAGE_PENDING_METADATA);
        this.pendingMetadata = null;
        this.lastMetadataEditTime = 0;
      } else {
        const remaining: UpdatePageMetadataInput = {
          ...(this.pendingMetadata ?? {}),
        };
        for (const key of Object.keys(
          snapshot,
        ) as (keyof UpdatePageMetadataInput)[]) {
          if (remaining[key] === snapshot[key]) {
            delete remaining[key];
          }
        }
        if (Object.keys(remaining).length === 0) {
          await this.storage.delete(STORAGE_PENDING_METADATA);
          this.pendingMetadata = null;
          this.lastMetadataEditTime = 0;
        } else {
          this.pendingMetadata = remaining;
          await this.storage.put(STORAGE_PENDING_METADATA, remaining);
        }
      }

      if (snapshot.title !== undefined && targetWorkspaceId) {
        await this.enqueueIndexing(targetWorkspaceId);
      }

      return { hasError: false };
    } catch (error) {
      console.error(
        `PagePersistence: failed to persist page ${this.pageId} metadata:`,
        error,
      );
      return { hasError: true };
    }
  }

  private async flushContent(
    document: PageDocument,
    targetWorkspaceId: WorkspaceId | null,
    forceFlushAll: boolean,
  ): Promise<{ hasError: boolean }> {
    if (!document.isDirty()) {
      return { hasError: false };
    }

    const now = Date.now();
    const isReady =
      forceFlushAll ||
      this.lastContentEditTime === 0 ||
      now + 100 >= this.lastContentEditTime + CONTENT_IDLE_DEBOUNCE_MS ||
      now + 100 >=
        this.firstUnpersistedContentEditTime + CONTENT_MAX_CHECKPOINT_MS;

    if (!isReady) {
      return { hasError: false };
    }

    const revision = document.getRevision();
    const state = document.encodeState();

    try {
      await this.storage.put(STORAGE_YJS_STATE, state);

      const updateResult = targetWorkspaceId
        ? await this.pagesService.updatePageContentWithOutbox({
            pageId: this.pageId,
            content: state,
            workspaceId: targetWorkspaceId,
            version: revision,
          })
        : await this.pagesService.updatePageContent({
            pageId: this.pageId,
            content: state,
          });

      if (!updateResult.isOk()) {
        console.error(
          "PagePersistence: failed to persist page content to PostgreSQL:",
          updateResult.error,
        );
        return { hasError: true };
      }

      const persistedLatestRevision = document.markPersisted(revision);
      if (persistedLatestRevision) {
        this.firstUnpersistedContentEditTime = 0;
        this.lastContentEditTime = 0;
        await this.storage.delete(STORAGE_CONTENT_DIRTY);
      }

      if (targetWorkspaceId) {
        await this.enqueueIndexing(targetWorkspaceId, revision);
      }

      return { hasError: false };
    } catch (error) {
      console.error(
        `PagePersistence: failed to persist page ${this.pageId} content:`,
        error,
      );
      return { hasError: true };
    }
  }

  private async persistInternalUnsafe(
    document: PageDocument,
    forceFlushAll: boolean,
  ): Promise<boolean> {
    const targetWorkspaceId = await this.resolveWorkspaceId();

    const [metadataFlush, contentFlush] = await Promise.all([
      this.flushMetadata(targetWorkspaceId, forceFlushAll),
      this.flushContent(document, targetWorkspaceId, forceFlushAll),
    ]);

    const hasError = metadataFlush.hasError || contentFlush.hasError;

    await this.recalculateAndScheduleAlarm(document, hasError);

    return !hasError;
  }

  private async recalculateAndScheduleAlarm(
    document: PageDocument,
    retryOnError = false,
  ): Promise<void> {
    const deadlines: number[] = [];
    const now = Date.now();

    if (retryOnError) {
      deadlines.push(now + 5_000);
    }

    const pendingMetadata = this.pendingMetadata;

    if (pendingMetadata && Object.keys(pendingMetadata).length > 0) {
      const metadataDeadline =
        (this.lastMetadataEditTime || now) + METADATA_DEBOUNCE_MS;
      deadlines.push(metadataDeadline);
    }

    if (document.isDirty()) {
      const idleDeadline =
        (this.lastContentEditTime || now) + CONTENT_IDLE_DEBOUNCE_MS;
      const maxCheckpointDeadline =
        (this.firstUnpersistedContentEditTime || now) +
        CONTENT_MAX_CHECKPOINT_MS;
      deadlines.push(Math.min(idleDeadline, maxCheckpointDeadline));
    }

    if (deadlines.length > 0) {
      const earliest = Math.min(...deadlines);
      await this.storage.setAlarm(Math.max(earliest, now + 50));
    } else {
      await this.storage.deleteAlarm();
    }
  }
}
