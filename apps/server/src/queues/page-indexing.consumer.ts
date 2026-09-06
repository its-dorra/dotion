import * as Y from "yjs";
import { createAppContext } from "#/context";
import { pageIndexingQueueMessageSchema } from "@dotion/shared/search/schema";
import type { PageIndexingQueueMessage } from "@dotion/shared/search/types";

/**
 * Consumes and processes background page indexing queue messages.
 * Validates message payload against Zod schema, parses Yjs document blocks,
 * generates vector embeddings using Gemini, and indexes sections in PostgreSQL.
 */
export async function processPageIndexingBatch(
  batch: MessageBatch<unknown>,
  env: Env,
): Promise<void> {
  const { services } = createAppContext(env);

  for (const msg of batch.messages) {
    // 1. Validate queue message schema with Zod
    const parseResult = pageIndexingQueueMessageSchema.safeParse(msg.body);
    if (!parseResult.success) {
      console.error(
        "PageIndexingConsumer: dropped invalid queue message schema:",
        parseResult.error.format(),
      );
      // Ack invalid messages to avoid poison pill retry loops
      msg.ack();
      continue;
    }

    const { workspaceId, pageId }: PageIndexingQueueMessage = parseResult.data;

    try {
      // 2. Fetch page metadata and Yjs binary content
      const [pageResult, contentResult] = await Promise.all([
        services.pages.getPageById(pageId),
        services.pages.getPageContent(pageId),
      ]);

      if (pageResult.isErr()) {
        console.warn(
          `PageIndexingConsumer: page ${pageId} no longer exists, acking.`,
        );
        msg.ack();
        continue;
      }

      const page = pageResult.value;
      const contentBinary = contentResult.isOk() ? contentResult.value : null;

      // 3. Hydrate Yjs document & parse text-only blocks
      let blocks: ReturnType<typeof services.chunking.parseYDocBlocks> = [];
      if (contentBinary && contentBinary.length > 0) {
        try {
          const ydoc = new Y.Doc();
          Y.applyUpdate(ydoc, contentBinary);
          blocks = services.chunking.parseYDocBlocks(ydoc);
        } catch (e) {
          console.error(
            `PageIndexingConsumer: failed to parse Y.Doc for page ${pageId}:`,
            e,
          );
        }
      }

      // 4. Split blocks into hierarchical document sections
      const sections = await services.chunking.parseDocumentSections(
        page.title,
        blocks,
      );

      // 5. Generate 768-dim embeddings via gemini-embedding-001
      const sectionTexts = sections.map(
        (s) => `${page.title} > ${s.sectionTitle}\n${s.content}`,
      );

      const embedResult = await services.embedding.embedBatch(sectionTexts);
      if (embedResult.isErr()) {
        console.error(
          `PageIndexingConsumer: failed to generate embeddings for page ${pageId}:`,
          embedResult.error,
        );
        msg.retry();
        continue;
      }

      const embeddings = embedResult.value;

      // 6. Map to index inputs and atomically upsert in PostgreSQL
      const indexInputs = sections.map((s, index) => ({
        sectionIndex: s.sectionIndex,
        sectionTitle: s.sectionTitle,
        headingBlockId: s.headingBlockId,
        blockIds: s.blockIds,
        content: s.content,
        contentHash: s.contentHash,
        embedding: embeddings[index] ?? [],
      }));

      const indexResult = await services.search.indexPageSections(
        workspaceId,
        pageId,
        indexInputs,
      );

      if (indexResult.isErr()) {
        console.error(
          `PageIndexingConsumer: database error indexing page ${pageId}:`,
          indexResult.error,
        );
        msg.retry();
        continue;
      }

      console.log(
        `PageIndexingConsumer: successfully indexed ${sections.length} sections for page ${pageId}.`,
      );
      msg.ack();
    } catch (error) {
      console.error(
        `PageIndexingConsumer: unexpected error processing page ${pageId}:`,
        error,
      );
      msg.retry();
    }
  }
}
