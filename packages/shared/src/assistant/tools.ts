import { z } from "zod";
import { pageId } from "../ids";
import type { InferUITools, Tool, UIMessage } from "ai";

export const searchWorkspaceInputSchema = z.object({
  query: z
    .string()
    .min(1, "Search query is required")
    .describe("The search query to look up"),
  limit: z
    .number()
    .min(1)
    .max(15)
    .optional()
    .default(5)
    .describe("Number of relevant sections to retrieve (default: 5)"),
  mode: z
    .enum(["conceptual", "exact", "balanced"])
    .optional()
    .default("conceptual")
    .describe(
      "Search mode: 'conceptual' (optimal for explanations), 'exact' (for code/identifiers), or 'balanced'",
    ),
});

export const searchWorkspaceHitSchema = z.object({
  sourceId: z.number(),
  pageId: pageId,
  pageTitle: z.string(),
  sectionTitle: z.string(),
  headingBlockId: z.string(),
  content: z.string(),
});

export const searchWorkspaceOutputSchema = z.object({
  items: z.array(searchWorkspaceHitSchema),
});

export const readFullPageInputSchema = z.object({
  pageId: pageId.describe("The ID of the page to read"),
});

export const readFullPageOutputSchema = z.object({
  pageId: pageId,
  pageTitle: z.string(),
  content: z.string(),
  charCount: z.number(),
  truncated: z.boolean(),
});

export const getPageTreeInputSchema = z.object({
  rootPageId: pageId
    .optional()
    .describe(
      "Optional parent page ID to descend from. If omitted, starts from workspace root.",
    ),
  maxDepth: z
    .number()
    .min(1)
    .max(5)
    .optional()
    .default(3)
    .describe("Maximum tree depth to traverse (default: 3)"),
});

export type PageTreeItem = {
  id: string;
  title: string;
  icon?: string | null;
  parentId?: string | null;
  children?: PageTreeItem[];
};

export const pageTreeItemSchema: z.ZodType<PageTreeItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    title: z.string(),
    icon: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
    children: z.array(pageTreeItemSchema).optional(),
  }),
);

export const getPageTreeOutputSchema = z.object({
  items: z.array(pageTreeItemSchema),
});

export const fetchAdjacentSectionsInputSchema = z.object({
  pageId: pageId.describe("The ID of the page"),
  sectionIndex: z
    .number()
    .int()
    .min(0)
    .describe("The reference section index to expand context from"),
  direction: z
    .enum(["prev", "next", "both"])
    .optional()
    .default("both")
    .describe(
      "Direction to fetch: 'prev' for preceding, 'next' for following, 'both' for surrounding",
    ),
  count: z
    .number()
    .int()
    .min(1)
    .max(3)
    .optional()
    .default(1)
    .describe("Number of adjacent sections to retrieve (default: 1)"),
});

export const adjacentSectionHitSchema = z.object({
  sectionIndex: z.number(),
  sectionTitle: z.string(),
  headingBlockId: z.string(),
  content: z.string(),
});

export const fetchAdjacentSectionsOutputSchema = z.object({
  pageId: pageId,
  items: z.array(adjacentSectionHitSchema),
});

export const getPageBlocksInputSchema = z.object({
  pageId: pageId.describe("The ID of the page"),
  headingBlockId: z
    .string()
    .optional()
    .describe(
      "Optional heading block ID to inspect all structured blocks under that heading",
    ),
  blockIds: z
    .array(z.string())
    .optional()
    .describe("Optional specific block IDs to inspect"),
});

export const structuredBlockSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.unknown()).optional(),
  contentText: z.string(),
  childrenCount: z.number().optional(),
});

export const getPageBlocksOutputSchema = z.object({
  pageId: pageId,
  blocks: z.array(structuredBlockSchema),
});

export type SearchWorkspaceInput = z.infer<typeof searchWorkspaceInputSchema>;
export type SearchWorkspaceHit = z.infer<typeof searchWorkspaceHitSchema>;
export type SearchWorkspaceOutput = z.infer<typeof searchWorkspaceOutputSchema>;

export type ReadFullPageInput = z.infer<typeof readFullPageInputSchema>;
export type ReadFullPageOutput = z.infer<typeof readFullPageOutputSchema>;

export type GetPageTreeInput = z.infer<typeof getPageTreeInputSchema>;
export type GetPageTreeOutput = z.infer<typeof getPageTreeOutputSchema>;

export type FetchAdjacentSectionsInput = z.infer<
  typeof fetchAdjacentSectionsInputSchema
>;
export type AdjacentSectionHit = z.infer<typeof adjacentSectionHitSchema>;
export type FetchAdjacentSectionsOutput = z.infer<
  typeof fetchAdjacentSectionsOutputSchema
>;

export type GetPageBlocksInput = z.infer<typeof getPageBlocksInputSchema>;
export type StructuredBlock = z.infer<typeof structuredBlockSchema>;
export type GetPageBlocksOutput = z.infer<typeof getPageBlocksOutputSchema>;

export type AssistantTools = {
  searchWorkspace: Tool<SearchWorkspaceInput, SearchWorkspaceOutput>;
  readFullPage: Tool<ReadFullPageInput, ReadFullPageOutput>;
  getPageTree: Tool<GetPageTreeInput, GetPageTreeOutput>;
  fetchAdjacentSections: Tool<
    FetchAdjacentSectionsInput,
    FetchAdjacentSectionsOutput
  >;
  getPageBlocks: Tool<GetPageBlocksInput, GetPageBlocksOutput>;
};

export type UITools = InferUITools<AssistantTools>;
export type ChatMessage = UIMessage<never, never, UITools>;
export type ToolPart = Extract<
  ChatMessage["parts"][number],
  { type: `tool-${string}` }
>;
