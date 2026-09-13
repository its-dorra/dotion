import { z } from "@hono/zod-openapi";
import { assistantThreads, assistantMessages } from "@dotion/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import {
  workspaceId,
  userId,
  assistantThreadId,
  assistantMessageId,
  pageId,
} from "../ids";
import type { UIMessage } from "ai";

export { assistantThreadId, assistantMessageId };

export const assistantCitationSchema = z.object({
  pageId: pageId,
  pageTitle: z.string(),
  sectionTitle: z.string(),
  headingBlockId: z.string(),
});

export const assistantToolCallSchema = z.object({
  type: z.string(),
  toolCallId: z.string(),
  state: z.string(),
  input: z.unknown().optional(),
  output: z.unknown().optional(),
  errorText: z.string().optional(),
});

export const assistantThreadSchema = createSelectSchema(assistantThreads, {
  id: assistantThreadId,
  workspaceId,
  userId,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createThreadRequestSchema = createInsertSchema(assistantThreads, {
  title: z.string().optional(),
}).pick({
  title: true,
});

export const assistantMessageSchema = createSelectSchema(assistantMessages, {
  id: assistantMessageId,
  threadId: assistantThreadId,
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  citations: z.array(assistantCitationSchema).nullable(),
  toolCalls: z.array(assistantToolCallSchema).nullable().optional(),
  tokensUsed: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createAssistantMessageSchema = createInsertSchema(
  assistantMessages,
  {
    threadId: assistantThreadId,
    role: z.enum(["user", "assistant", "system"]),
    citations: z.array(assistantCitationSchema).optional(),
    toolCalls: z.array(assistantToolCallSchema).optional(),
  },
).pick({
  threadId: true,
  role: true,
  content: true,
  citations: true,
  toolCalls: true,
  tokensUsed: true,
});

export const sendAssistantMessageRequestSchema = z.object({
  messages: z
    .custom<UIMessage[]>(
      (val) => Array.isArray(val) && val.length > 0,
      "Must be a non-empty array of chat messages",
    )
    .openapi({
      type: "array",
      description: "An array of chat messages to send to the assistant",
    }),
});

export const listPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const paginatedThreadsResponseSchema = z.object({
  items: z.array(assistantThreadSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export const paginatedMessagesResponseSchema = z.object({
  items: z.array(assistantMessageSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});
