import { createDb } from "@notion-clone/db";
import * as schema from "@notion-clone/db/schema/auth";
import { env } from "@notion-clone/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { redisSecondaryStorage } from "./adapters/redis-secondary-storage";

export function createAuth() {
  const db = createDb();

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
      usePlural: true,
    }),

    rateLimit: {
      enabled: true,
      storage: "secondary-storage",
    },

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
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
    },
  });
}

export const auth = createAuth();
