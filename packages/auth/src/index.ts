import type { UserId } from "@dotion/shared/users/types";
import type { DBClient } from "@dotion/db";
import * as schema from "@dotion/db/schema";
import { betterAuth, type SecondaryStorage } from "better-auth";
import { openAPI } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

interface AuthEnv {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CORS_ORIGIN: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  NODE_ENV: string;
}

export function createAuth(
  db: DBClient,
  secondaryStorage: SecondaryStorage,
  env: AuthEnv,
) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
      usePlural: true,
    }),

    secondaryStorage,

    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        httpOnly: true,
      },
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
      },
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      },
    },
    plugins: [
      openAPI({
        disableDefaultReference: true,
      }),
    ],
  });
}

export type User = Omit<
  ReturnType<typeof createAuth>["$Infer"]["Session"]["user"],
  "id"
> & {
  id: UserId;
};
export type BetterAuthInstance = ReturnType<typeof createAuth>;
