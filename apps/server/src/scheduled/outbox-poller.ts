import { createAppContext } from "#/context";

export async function handleScheduledOutbox(env: Env): Promise<void> {
  const { services } = createAppContext(env);
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

  const staleEntriesResult = await services.outbox.getStaleEntries(
    twoMinutesAgo,
    50,
  );

  if (staleEntriesResult.isErr()) {
    console.error(
      "OutboxPoller: failed to query stale outbox entries:",
      staleEntriesResult.error,
    );
    return;
  }

  const entries = staleEntriesResult.value;
  if (entries.length === 0) {
    return;
  }

  console.log(
    `OutboxPoller: found ${entries.length} stale outbox entries, redelivering...`,
  );

  await Promise.all(
    entries.map(async (entry) => {
      try {
        if (entry.type === "page_indexing" && env.PAGE_INDEXING_QUEUE) {
          await env.PAGE_INDEXING_QUEUE.send(entry.payload);
          console.log(
            `OutboxPoller: successfully re-enqueued page indexing for ${entry.aggregateId}.`,
          );
        }
      } catch (error) {
        console.error(
          `OutboxPoller: failed to redeliver outbox entry ${entry.id}:`,
          error,
        );
      }
    }),
  );
}
