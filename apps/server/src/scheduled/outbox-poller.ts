import { createAppContext } from "#/context";
import { DomainEventSchema } from "@dotion/shared/events";

export async function handleScheduledOutbox(
  env: Env,
  ctx?: ExecutionContext,
): Promise<void> {
  const { services, eventRouter } = createAppContext(env, ctx);
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

  const staleEntriesResult = await services.outbox.getStaleEntries({
    olderThan: twoMinutesAgo,
    limit: 50,
  });

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
        const parsed = DomainEventSchema.safeParse({
          type: entry.type,
          aggregateId: entry.aggregateId,
          payload: entry.payload,
        });

        if (parsed.success) {
          await eventRouter.dispatch(parsed.data);
          await services.outbox.markCompleted({
            type: entry.type,
            aggregateId: entry.aggregateId,
          });
          console.log(
            `OutboxPoller: successfully redelivered ${entry.type} for ${entry.aggregateId}.`,
          );
        } else if (entry.type === "page_indexing" && env.PAGE_INDEXING_QUEUE) {
          await env.PAGE_INDEXING_QUEUE.send(entry.payload);
          await services.outbox.markCompleted({
            type: entry.type,
            aggregateId: entry.aggregateId,
          });
        } else {
          console.warn(
            `OutboxPoller: unmatched schema for event ${entry.type}:`,
            parsed.error.format(),
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
