import * as Sentry from "@sentry/cloudflare";
import app from "./app";
import { processQueueBatch } from "./queues";

export { WorkspacesDO } from "./routes/workspaces/durable-object";
export { PagesDO } from "./routes/workspaces/pages/durable-object";
export { UsersDO } from "./routes/users/durable-object";
export { UserCreditsDO } from "./routes/users/credits-durable-object";

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
    queue: processQueueBatch,
  } satisfies ExportedHandler<Env>,
);
