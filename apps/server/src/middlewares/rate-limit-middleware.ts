import type { AppBindings, HonoContext } from "#/lib/types";
import { errorResponseJson } from "#/lib/utils";
import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";

export interface RateLimitOptions {
  limiter: (env: Env) => RateLimit;
  keyGenerator: (c: HonoContext) => string | Promise<string>;
  errorMessage?: string;
  skip?: (c: HonoContext) => boolean | Promise<boolean>;
}

export function rateLimit(options: RateLimitOptions) {
  return createMiddleware<AppBindings>(async (c, next) => {
    if (options.skip && (await options.skip(c))) {
      return next();
    }

    const limiter = options.limiter(c.env);
    if (!limiter) {
      return next();
    }

    const key = await options.keyGenerator(c);
    const { success } = await limiter.limit({ key });

    if (!success) {
      return c.json(
        errorResponseJson(
          options.errorMessage ??
            "Rate limit exceeded. Please try again later.",
        ),
        HttpStatusCodes.TOO_MANY_REQUESTS,
        { "Retry-After": "60" },
      );
    }

    return next();
  });
}

export const standardApiRateLimit: RateLimitOptions = {
  limiter: (env) => env.API_RATE_LIMITER,
  keyGenerator: (c: HonoContext) => `api:${c.var.currentUser.id}`,
  errorMessage: "Rate limit exceeded. Please slow down.",
};

export const aiRateLimit: RateLimitOptions = {
  limiter: (env) => env.AI_RATE_LIMITER,
  keyGenerator: (c: HonoContext) => `ai:${c.var.currentUser.id}`,
  errorMessage: "Too many AI requests. Please slow down.",
};
