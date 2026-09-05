import * as Sentry from "@sentry/cloudflare";
import app from "./app";
import { createAppContext } from "./context";
import * as Y from "yjs";
import type { PageId } from "@dotion/shared/pages/types";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";

export { WorkspacesDO } from "./routes/workspaces/durable-object";
export { PagesDO } from "./routes/workspaces/pages/durable-object";
export { UsersDO } from "./routes/users/durable-object";
export { UserCreditsDO } from "./routes/users/credits-durable-object";

export interface PageIndexingMessage {
  workspaceId: WorkspaceId;
  pageId: PageId;
  version?: number;
}

export async function processPageIndexingBatch(
  batch: MessageBatch<unknown>,
  env: Env,
): Promise<void> {
  const { services } = createAppContext(env);

  for (const msg of batch.messages) {
    const { workspaceId, pageId } = msg.body as PageIndexingMessage;
    try {
      const [pageResult, contentResult] = await Promise.all([
        services.pages.getPageById(pageId),
        services.pages.getPageContent(pageId),
      ]);

      if (pageResult.isErr()) {
        console.warn(`Queue: page ${pageId} not found, acking.`);
        msg.ack();
        continue;
      }

      const page = pageResult.value;
      const contentBinary = contentResult.isOk() ? contentResult.value : null;

      let blocks: ReturnType<typeof services.chunking.parseYDocBlocks> = [];
      if (contentBinary && contentBinary.length > 0) {
        try {
          const ydoc = new Y.Doc();
          Y.applyUpdate(ydoc, contentBinary);
          blocks = services.chunking.parseYDocBlocks(ydoc);
        } catch (e) {
          console.error(`Queue: failed to parse Y.Doc for page ${pageId}:`, e);
        }
      }

      const sections = await services.chunking.parseDocumentSections(
        page.title,
        blocks,
      );

      const sectionTexts = sections.map(
        (s) => `${page.title} > ${s.sectionTitle}\n${s.content}`,
      );
      const embedResult = await services.embedding.embedBatch(sectionTexts);

      if (embedResult.isErr()) {
        console.error(
          `Queue: failed to generate embeddings for page ${pageId}:`,
          embedResult.error,
        );
        msg.retry();
        continue;
      }

      const embeddings = embedResult.value;

      const indexInputs = sections.map((s, index) => ({
        sectionIndex: s.sectionIndex,
        sectionTitle: s.sectionTitle,
        headingBlockId: s.headingBlockId,
        blockIds: s.blockIds,
        content: s.content,
        contentHash: s.contentHash,
        embedding: embeddings[index] ?? [],
      }));

      await services.search.indexPageSections(workspaceId, pageId, indexInputs);
      msg.ack();
    } catch (error) {
      console.error(`Queue: error processing page ${pageId}:`, error);
      msg.retry();
    }
  }
}

type ApiApp = typeof app;
export type { ApiApp };

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,

    dataCollection: {
      userInfo: false,
      httpBodies: [],
    },
  }),
  {
    fetch: app.fetch,
    queue: processPageIndexingBatch,
  } satisfies ExportedHandler<Env, PageIndexingMessage>,
);
