import type { AppBindings } from "#/lib/types";
import { errorResponseJson } from "#/lib/utils";
import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

export const currentUserMiddleware = createMiddleware<AppBindings>(
  async (c, next) => {
    const currentUser = await c.var.auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!currentUser) {
      return c.json(
        errorResponseJson(HttpStatusPhrases.UNAUTHORIZED),
        HttpStatusCodes.UNAUTHORIZED,
      );
    }

    // @ts-expect-error
    c.set("currentUser", currentUser.user);

    return next();
  },
);
