import { createAppContext } from "#/context";
import { PageCleanupQueueMessageSchema } from "@dotion/shared/pages/schema";
import type { PageCleanupQueueMessage } from "@dotion/shared/pages/types";

/**
 * Consumes and processes background page cleanup queue messages.
 * Validates message payload against Zod schema and deletes all R2 files
 * stored under the page's prefix in the workspace bucket.
 */
export async function processPageCleanupBatch(
  batch: MessageBatch<unknown>,
  env: Env,
): Promise<void> {
  const { services } = createAppContext(env);

  for (const msg of batch.messages) {
    // 1. Validate queue message schema with Zod
    const parseResult = PageCleanupQueueMessageSchema.safeParse(msg.body);
    if (!parseResult.success) {
      console.error(
        "PageCleanupConsumer: dropped invalid queue message schema:",
        parseResult.error.format(),
      );
      msg.ack();
      continue;
    }

    const { workspaceId, pageId }: PageCleanupQueueMessage = parseResult.data;

    try {
      // 2. Delete all page files in R2 storage
      const deleteResult = await services.storage.deletePageFiles(
        workspaceId,
        pageId,
      );

      if (deleteResult.isErr()) {
        console.error(
          `PageCleanupConsumer: failed to delete R2 files for page ${pageId}:`,
          deleteResult.error,
        );
        msg.retry();
        continue;
      }

      console.log(
        `PageCleanupConsumer: successfully cleaned up assets for page ${pageId}.`,
      );
      msg.ack();
    } catch (error) {
      console.error(
        `PageCleanupConsumer: unexpected error processing cleanup for page ${pageId}:`,
        error,
      );
      msg.retry();
    }
  }
}
