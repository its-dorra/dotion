import { timestamp, uuid } from "drizzle-orm/pg-core";

export const createdAt = timestamp("created_at").defaultNow().notNull();
export const updatedAt = timestamp("updated_at")
  .defaultNow()
  .$onUpdate(() => new Date())
  .notNull();

export const uuidId = (name: string) => uuid(name).primaryKey().defaultRandom();
