import {
  snakeCase,
  text,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt, textId } from "../utils";
import type { OutboxEntryId } from "@dotion/shared/ids";

export const outbox = snakeCase.table(
  "outbox",
  {
    id: textId<OutboxEntryId>(),
    type: text().notNull(),
    aggregateId: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>().notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("idx_outbox_type_aggregate_id").on(t.type, t.aggregateId),
    index("idx_outbox_updated_at").on(t.updatedAt),
    index("idx_outbox_type").on(t.type),
  ],
);
