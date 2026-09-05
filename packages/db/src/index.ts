import { drizzle } from "drizzle-orm/neon-serverless";
import { relations } from "./schema/relations";

export function createDb(connectionString: string) {
  return drizzle(connectionString, {
    relations,
  });
}

export type DBClient = ReturnType<typeof createDb>;
export type DBTransaction = Parameters<
  Parameters<DBClient["transaction"]>[0]
>[0];

export type AppDB = DBClient | DBTransaction;
export * from "./errors";
