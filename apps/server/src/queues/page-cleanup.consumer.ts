import { createAppContext } from "#/context";
import { PageCleanupQueueMessageSchema } from "@dotion/shared/pages/schema";

export async function processPageCleanupBatch(
  batch: MessageBatch<unknown>,
  env: Env,
): Promise<void> {
  const { services } = createAppContext(env);

  for (const msg of batch.messages) {
    const parseResult = PageCleanupQueueMessageSchema.safeParse(msg.body);
    if (!parseResult.success) {
      console.error(
        "PageCleanupConsumer: dropped invalid queue message schema:",
        parseResult.error.format(),
      );
      msg.ack();
      continue;
    }

    const { workspaceId, pageId } = parseResult.data;

    try {
      const deleteResult = await services.storage.deletePageFiles({
        workspaceId,
        pageId,
      });

      if (deleteResult.isErr()) {
        console.error(
          `PageCleanupConsumer: failed to delete R2 files for page ${pageId}:`,
          deleteResult.error,
        );
        msg.retry();
        continue;
      }

      console.log(
        `PageCleanupConsumer: successfully cleaned up ${deleteResult.value.deletedCount} assets for page ${pageId}.`,
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
