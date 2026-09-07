import { z } from "zod";
import { outboxEntryId, workspaceId, pageId } from "../ids";
import { outbox } from "@dotion/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";

export const OutboxEntrySchema = createSelectSchema(outbox, {
  id: outboxEntryId,
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateOutboxEntrySchema = createInsertSchema(outbox, {
  id: outboxEntryId.optional(),
  payload: z.record(z.string(), z.unknown()),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const pageIndexingPayloadSchema = z.object({
  workspaceId,
  pageId,
  version: z.number().optional(),
});

export type OutboxEntry = z.infer<typeof OutboxEntrySchema>;
export type CreateOutboxEntryInput = z.infer<typeof CreateOutboxEntrySchema>;
export type PageIndexingPayload = z.infer<typeof pageIndexingPayloadSchema>;
