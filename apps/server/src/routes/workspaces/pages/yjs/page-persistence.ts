import type { PagesService } from "@dotion/services";
import type { PageDocument } from "./page-document";
import type {
  Page,
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
    private readonly workspaceId?: WorkspaceId | null,
  ) {}

  async loadInitialState(document?: PageDocument): Promise<Uint8Array | null> {
    const storedState = await this.storage.get<Uint8Array>(STORAGE_YJS_STATE);

    const isDirty = await this.storage.get<boolean>(STORAGE_CONTENT_DIRTY);
    if (isDirty && document) {
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
      await this.storage.put(STORAGE_YJS_STATE, state);
      await this.storage.put(STORAGE_CONTENT_DIRTY, true);
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

    const pendingMetadata = await this.storage.get<UpdatePageMetadataInput>(
      STORAGE_PENDING_METADATA,
    );

    const isMetadataReady =
      pendingMetadata &&
      Object.keys(pendingMetadata).length > 0 &&
      (forceFlushAll ||
        this.lastMetadataEditTime === 0 ||
        now + 100 >= this.lastMetadataEditTime + METADATA_DEBOUNCE_MS);

    if (isMetadataReady) {
      try {
        let metadataResult;
        let targetWorkspaceId = this.workspaceId;

        if (pendingMetadata.title !== undefined) {
          if (!targetWorkspaceId) {
            const pageLookup = await this.pagesService.getPageById({
              pageId: this.pageId,
            });
            if (pageLookup.isOk()) {
              targetWorkspaceId = pageLookup.value.workspaceId;
            }
          }

          if (targetWorkspaceId) {
            metadataResult =
              await this.pagesService.updatePageMetadataWithOutbox({
                pageId: this.pageId,
                data: pendingMetadata,
                workspaceId: targetWorkspaceId,
              });
          } else {
            metadataResult = await this.pagesService.updatePageMetadata({
              pageId: this.pageId,
              data: pendingMetadata,
            });
          }
        } else {
          metadataResult = await this.pagesService.updatePageMetadata({
            pageId: this.pageId,
            data: pendingMetadata,
          });
        }

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

          if (
            pendingMetadata.title !== undefined &&
            this.env?.PAGE_INDEXING_QUEUE &&
            targetWorkspaceId
          ) {
            try {
              const message: PageIndexingQueueMessage = {
                workspaceId: targetWorkspaceId,
                pageId: this.pageId,
              };
              await this.env.PAGE_INDEXING_QUEUE.send(message);
              console.log(
                `PagePersistence: enqueued indexing message for page ${this.pageId} (title update).`,
              );
            } catch (err) {
              console.warn(
                "PagePersistence: fast-path queue send failed on title update (will be caught by outbox poller):",
                err,
              );
            }
          }
        }
      } catch (error) {
        console.error(
          `PagePersistence: failed to persist page ${this.pageId} metadata:`,
          error,
        );
        hasError = true;
      }
    }

    const isContentDirty = document && document.isDirty();
    const isContentReady =
      isContentDirty &&
      (forceFlushAll ||
        this.lastContentEditTime === 0 ||
        now + 100 >= this.lastContentEditTime + CONTENT_IDLE_DEBOUNCE_MS ||
        now + 100 >=
          this.firstUnpersistedContentEditTime + CONTENT_MAX_CHECKPOINT_MS);

    if (isContentReady && document) {
      const revision = document.getRevision();
      const state = document.encodeState();

      try {
        await this.storage.put(STORAGE_YJS_STATE, state);

        let targetWorkspaceId = this.workspaceId;
        if (!targetWorkspaceId) {
          const pageLookup = await this.pagesService.getPageById({
            pageId: this.pageId,
          });
          if (pageLookup.isOk()) {
            targetWorkspaceId = pageLookup.value.workspaceId;
          }
        }

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
          hasError = true;
        } else {
          const persistedLatestRevision = document.markPersisted(revision);
          if (persistedLatestRevision) {
            this.firstUnpersistedContentEditTime = 0;
            this.lastContentEditTime = 0;
            await this.storage.delete(STORAGE_CONTENT_DIRTY);
          }
          console.log(
            `PagePersistence: persisted page ${this.pageId} content at revision ${revision}.`,
          );

          if (this.env?.PAGE_INDEXING_QUEUE && targetWorkspaceId) {
            try {
              const message: PageIndexingQueueMessage = {
                workspaceId: targetWorkspaceId,
                pageId: this.pageId,
                version: revision,
              };
              await this.env.PAGE_INDEXING_QUEUE.send(message);
              console.log(
                `PagePersistence: successfully enqueued indexing message for page ${this.pageId} (version ${revision}).`,
              );
            } catch (err) {
              console.warn(
                "PagePersistence: fast-path queue send failed on content update (will be caught by outbox poller):",
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

    const pendingMetadata = await this.storage.get<UpdatePageMetadataInput>(
      STORAGE_PENDING_METADATA,
    );
    if (pendingMetadata && Object.keys(pendingMetadata).length > 0) {
      const metadataDeadline =
        (this.lastMetadataEditTime || now) + METADATA_DEBOUNCE_MS;
      deadlines.push(metadataDeadline);
    }

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
      await this.storage.setAlarm(Math.max(earliest, now + 50));
    } else {
      await this.storage.deleteAlarm();
    }
  }
}
