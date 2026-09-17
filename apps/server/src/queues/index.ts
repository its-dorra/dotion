export * from "./page-indexing.consumer";
import { processPageIndexingBatch } from "./page-indexing.consumer";
import { processPageCleanupBatch } from "./page-cleanup.consumer";

type QueueProcessor = (batch: MessageBatch<unknown>, env: Env) => Promise<void>;

const queueProcessors: Record<string, QueueProcessor> = {
  "dotion-page-cleanup": processPageCleanupBatch,
  "dotion-page-indexing": processPageIndexingBatch,
};

export async function processQueueBatch(
  batch: MessageBatch<unknown>,
  env: Env,
): Promise<void> {
  const handler = queueProcessors[batch.queue];
  if (handler) {
    return handler(batch, env);
  }
  console.warn(`No queue handler registered for queue: ${batch.queue}`);
}
