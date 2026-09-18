import { createAppContext } from "#/context";
import { pageIndexingQueueMessageSchema } from "@dotion/shared/search/schema";
import { NotFoundError } from "@dotion/db/errors";
import { z } from "zod";

export async function processPageIndexingBatch(
  batch: MessageBatch<unknown>,
  env: Env,
): Promise<void> {
  const { services } = createAppContext(env);

  for (const msg of batch.messages) {
    const parseResult = pageIndexingQueueMessageSchema.safeParse(msg.body);
    if (!parseResult.success) {
      console.error(
        "PageIndexingConsumer: dropped invalid queue message schema:",
        z.treeifyError(parseResult.error),
      );
      msg.ack();
      continue;
    }

    const { workspaceId, pageId } = parseResult.data;
    const claimedAt = new Date();

    try {
      const result = await services.search.indexPage({ workspaceId, pageId });

      if (result.isErr()) {
        if (NotFoundError.is(result.error)) {
          console.warn(
            `PageIndexingConsumer: page ${pageId} no longer exists, acking and releasing outbox.`,
          );
          await services.outbox.markCompleted({
            type: "page_indexing",
            aggregateId: pageId,
          });
          msg.ack();
        } else {
          console.error(
            `PageIndexingConsumer: failed to index page ${pageId}:`,
            result.error,
          );
          msg.retry();
          const MAX_INDEXING_ATTEMPTS = 3;
          if (msg.attempts >= MAX_INDEXING_ATTEMPTS) {
            console.error(
              `PageIndexingConsumer: permanently failed to index page ${pageId} after ${msg.attempts} attempts:`,
              result.error,
            );
            await services.outbox.markCompleted({
              type: "page_indexing",
              aggregateId: pageId,
            });
            msg.ack();
          } else {
            console.error(
              `PageIndexingConsumer: failed to index page ${pageId} (attempt ${msg.attempts}):`,
              result.error,
            );
            msg.retry();
          }
        }
        continue;
      }

      const summary = result.value;
      console.log(
        `PageIndexingConsumer: successfully indexed page ${pageId} (${summary.inserted} inserted, ${summary.updatedContent} re-embedded, ${summary.updatedMeta} metadata updated, ${summary.deleted} deleted, ${summary.unchanged} unchanged).`,
      );
      await services.outbox.markCompleted({
        type: "page_indexing",
        aggregateId: pageId,
        claimedAt,
      });
      msg.ack();
    } catch (error) {
      console.error(
        `PageIndexingConsumer: unexpected error processing page ${pageId}:`,
        error,
      );
      msg.retry();
      const MAX_INDEXING_ATTEMPTS = 3;
      if (msg.attempts >= MAX_INDEXING_ATTEMPTS) {
        console.error(
          `PageIndexingConsumer: unexpected permanent failure for page ${pageId} after ${msg.attempts} attempts:`,
          error,
        );
        await services.outbox.markCompleted({
          type: "page_indexing",
          aggregateId: pageId,
        });
        msg.ack();
      } else {
        console.error(
          `PageIndexingConsumer: unexpected error processing page ${pageId} (attempt ${msg.attempts}):`,
          error,
        );
        msg.retry();
      }
    }
  }
}
