import { z } from "zod";
import { workspaceId, pageId, pageSectionId } from "../ids";

export const searchRequestQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const searchResultItemSchema = z.object({
  sectionId: pageSectionId,
  pageId: pageId,
  workspaceId: workspaceId,
  sectionIndex: z.number(),
  sectionTitle: z.string(),
  headingBlockId: z.string(),
  content: z.string(),
  score: z.number(),
  pageTitle: z.string(),
  pageIcon: z.string().nullable(),
});

export const searchResponseSchema = z.object({
  items: z.array(searchResultItemSchema),
});

export type SearchRequestQuery = z.infer<typeof searchRequestQuerySchema>;
export type SearchResultItem = z.infer<typeof searchResultItemSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
