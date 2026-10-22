import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppBindings, HonoContext } from "./types";
import { cors } from "hono/cors";
import { createAppContext } from "#/context";
import { secureHeaders } from "hono/secure-headers";
import { notFound, onError, serveEmojiFavicon } from "stoker/middlewares";
import defaultHook from "stoker/openapi/default-hook";
import configureOpenAPI from "./configure-open-api";
import { logger } from "hono/logger";
import { csrf } from "hono/csrf";
import { sentry } from "@sentry/hono/cloudflare";
import { getSentryOptions } from "./utils";

export function createRoute() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export function createApp() {
  const app = createRoute();

  app.use(sentry(app, getSentryOptions));

  app
    .use(
      "*",
      cors({
        origin: (origin, c: HonoContext) => c.env.CORS_ORIGIN || origin,
        credentials: true,
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-File-Name",
          "X-File-Size",
        ],
        allowMethods: ["POST", "GET", "PATCH", "DELETE", "OPTIONS"],
        maxAge: 600,
      }),
    )
    .use(logger())
    .use(csrf())
    .use(secureHeaders())
    .use(serveEmojiFavicon("😁"))
    .use("*", async (c, next) => {
      const context = createAppContext(c.env, c.executionCtx);
      c.set("auth", context.auth);
      c.set("services", context.services);

      return next();
    });

  configureOpenAPI(app);

  app.notFound(notFound);
  app.onError(onError);

  return app;
}
