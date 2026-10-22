import { instrumentDurableObjectWithSentry } from "@sentry/cloudflare";
import app from "./app";
import { processQueueBatch } from "./queues";
import { handleScheduledOutbox } from "./scheduled/outbox-poller";
import { WorkspacesDO as RawWorkspacesDO } from "./routes/workspaces/durable-object";
import { PagesDO as RawPagesDO } from "./routes/workspaces/pages/durable-object";
import { UsersDO as RawUsersDO } from "./routes/users/durable-object";
import { UserCreditsDO as RawUserCreditsDO } from "./routes/users/credits-durable-object";
import { getSentryOptions } from "./lib/utils";

export const WorkspacesDO = instrumentDurableObjectWithSentry(
  getSentryOptions,
  RawWorkspacesDO,
);
export const PagesDO = instrumentDurableObjectWithSentry(
  getSentryOptions,
  RawPagesDO,
);
export const UsersDO = instrumentDurableObjectWithSentry(
  getSentryOptions,
  RawUsersDO,
);
export const UserCreditsDO = instrumentDurableObjectWithSentry(
  getSentryOptions,
  RawUserCreditsDO,
);

type ApiApp = typeof app;
export type { ApiApp };

export default {
  fetch: app.fetch,
  queue: processQueueBatch,
  scheduled: async (_event, env, ctx) => {
    ctx.waitUntil(handleScheduledOutbox(env, ctx));
  },
} satisfies ExportedHandler<Env>;
