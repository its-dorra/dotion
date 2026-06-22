import { createDb } from "@notion-clone/db";
import * as schema from "@notion-clone/db/schema/auth";
import { env } from "@notion-clone/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { redisInstance } from "@notion-clone/redis";
import { redisSecondaryStorage } from "./adapters/redis-secondary-storage";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
      usePlural: true,
    }),

    secondaryStorage: redisSecondaryStorage,

    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: true,
        httpOnly: true,
      },
    },
    plugins: [],
  });
}

export const auth = createAuth();
