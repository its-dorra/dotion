import { z } from "zod";
import { workspaceId, pageId, pageSectionId, type PageSectionId } from "../ids";
import { pageSections } from "@dotion/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { createPaginatedDataSchema } from "../pagination/schema";
import type { PaginatedData } from "../pagination/types";

export const PageSectionSchema = createSelectSchema(pageSections, {
  id: pageSectionId,
  workspaceId,
  pageId,
  blockIds: z.array(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreatePageSectionSchema = createInsertSchema(pageSections, {
  id: pageSectionId.optional(),
  workspaceId,
  pageId,
  blockIds: z.array(z.string()),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdatePageSectionSchema = createInsertSchema(pageSections, {
  id: pageSectionId,
  workspaceId,
  pageId,
  blockIds: z.array(z.string()),
})
  .pick({
    sectionIndex: true,
    sectionTitle: true,
    blockIds: true,
    content: true,
    contentHash: true,
    embedding: true,
  })
  .partial();

export const PageSectionMetaSchema = PageSectionSchema.pick({
  id: true,
  headingBlockId: true,
  contentHash: true,
  sectionIndex: true,
  sectionTitle: true,
  blockIds: true,
});

export const searchModeSchema = z.enum(["conceptual", "balanced", "exact"]);

export const searchRequestQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  mode: searchModeSchema.default("balanced").optional(),
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

export const PaginatedSearchResultDataSchema = createPaginatedDataSchema(
  searchResultItemSchema,
);

export const searchResponseSchema = PaginatedSearchResultDataSchema;

export const pageIndexingQueueMessageSchema = z.object({
  workspaceId: workspaceId,
  pageId: pageId,
  version: z.number().optional(),
});

export const indexPageResultSchema = z.object({
  pageId: pageId,
  inserted: z.number(),
  updatedContent: z.number(),
  updatedMeta: z.number(),
  deleted: z.number(),
  unchanged: z.number(),
});

export type PageSection = z.infer<typeof PageSectionSchema>;
export type CreatePageSectionInput = z.infer<typeof CreatePageSectionSchema>;
export type UpdatePageSectionInput = z.infer<typeof UpdatePageSectionSchema> & {
  id: PageSectionId;
};
export type PageSectionMeta = z.infer<typeof PageSectionMetaSchema>;
export type SearchMode = z.infer<typeof searchModeSchema>;
export type SearchRequestQuery = z.infer<typeof searchRequestQuerySchema>;
export type SearchResultItem = z.infer<typeof searchResultItemSchema>;
export type PaginatedSearchResultData = PaginatedData<SearchResultItem>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;
export type PageIndexingQueueMessage = z.infer<
  typeof pageIndexingQueueMessageSchema
>;
export type IndexPageResult = z.infer<typeof indexPageResultSchema>;
