import { z } from "zod";
import {
  workspaceId,
  userId,
  assistantThreadId,
  assistantMessageId,
  pageId,
} from "../ids";

export const assistantCitationSchema = z.object({
  pageId: pageId,
  pageTitle: z.string(),
  sectionTitle: z.string(),
  headingBlockId: z.string(),
});

export const assistantThreadSchema = z.object({
  id: assistantThreadId,
  workspaceId: workspaceId,
  userId: userId,
  title: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const assistantMessageSchema = z.object({
  id: assistantMessageId,
  threadId: assistantThreadId,
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  citations: z.array(assistantCitationSchema).nullable(),
  tokensUsed: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createThreadRequestSchema = z.object({
  title: z.string().optional(),
});

export const sendAssistantMessageRequestSchema = z.object({
  content: z.string().min(1, "Message content is required"),
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

export type AssistantCitation = z.infer<typeof assistantCitationSchema>;
export type AssistantThread = z.infer<typeof assistantThreadSchema>;
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;
export type CreateThreadRequest = z.infer<typeof createThreadRequestSchema>;
export type SendAssistantMessageRequest = z.infer<
  typeof sendAssistantMessageRequestSchema
>;
export type ListPaginationQuery = z.infer<typeof listPaginationQuerySchema>;
export type PaginatedThreadsResponse = z.infer<
  typeof paginatedThreadsResponseSchema
>;
export type PaginatedMessagesResponse = z.infer<
  typeof paginatedMessagesResponseSchema
>;
