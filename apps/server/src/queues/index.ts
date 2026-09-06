export * from "./page-indexing.consumer";
import { processPageIndexingBatch } from "./page-indexing.consumer";
import { processPageCleanupBatch } from "./page-cleanup.consumer";

export { processPageIndexingBatch, processPageCleanupBatch };

export async function processQueueBatch(
  batch: MessageBatch<unknown>,
  env: Env,
): Promise<void> {
  switch (batch.queue) {
    case "dotion-page-cleanup":
      return processPageCleanupBatch(batch, env);
    case "dotion-page-indexing":
    default:
      return processPageIndexingBatch(batch, env);
  }
}
