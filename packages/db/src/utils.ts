import { timestamp, text } from "drizzle-orm/pg-core";

export const createdAt = timestamp("created_at")
  .$defaultFn(() => new Date())
  .notNull();
export const updatedAt = timestamp("updated_at")
  .$defaultFn(() => new Date())
  .$onUpdate(() => new Date())
  .notNull();

export const textId = <T extends string = string>() =>
  text()
    .$type<T>()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID() as T);
