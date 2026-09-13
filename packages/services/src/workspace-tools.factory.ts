import { Result } from "better-result";
import { tool, type ToolSet } from "ai";
import * as Y from "yjs";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { PageId, BlockNoteBlock } from "@dotion/shared/pages/types";
import type { AssistantCitation } from "@dotion/shared/assistant/types";
import {
  searchWorkspaceInputSchema,
  readFullPageInputSchema,
  getPageTreeInputSchema,
  fetchAdjacentSectionsInputSchema,
  getPageBlocksInputSchema,
} from "@dotion/shared/assistant/tools";
import type { SearchService } from "./search.service";
import type { PagesService } from "./pages.service";
import type { ChunkingService } from "./chunking.service";

export interface CreateWorkspaceToolsOptions {
  searchService: SearchService;
  pagesService: PagesService;
  chunkingService: ChunkingService;
  workspaceId: WorkspaceId;
  citations?: AssistantCitation[];
  onCitationCollected?: (citation: AssistantCitation) => void;
}

export function createWorkspaceTools(
  options: CreateWorkspaceToolsOptions,
): ToolSet {
  const {
    searchService,
    pagesService,
    chunkingService,
    workspaceId,
    citations,
    onCitationCollected,
  } = options;

  const searchWorkspace = tool({
    description:
      "Search the workspace knowledge base across all pages. Specify 'query' and 'mode' ('conceptual' for explanations, summaries, and broad questions in any language; 'exact' for specific code identifiers, table names, error codes, or quoted phrases; 'balanced' for general lookups).",
    inputSchema: searchWorkspaceInputSchema,
    execute: async ({ query, limit, mode }) => {
      const searchResult = await Result.gen(async function* () {
        const results = yield* Result.await(
          searchService.hybridSearch({
            workspaceId,
            query,
            limit: limit ?? 5,
            mode: mode ?? "conceptual",
          }),
        );

        const items = results.payload;
        const startIndex = citations?.length ?? 0;

        if (citations) {
          items.forEach((item) => {
            const citation: AssistantCitation = {
              pageId: item.pageId,
              pageTitle: item.pageTitle,
              sectionTitle: item.sectionTitle,
              headingBlockId: item.headingBlockId,
            };
            citations.push(citation);
            onCitationCollected?.(citation);
          });
        }

        return Result.ok({
          items: items.map((item, index) => ({
            sourceId: citations ? startIndex + index + 1 : index + 1,
            pageId: item.pageId,
            pageTitle: item.pageTitle,
            sectionTitle: item.sectionTitle,
            headingBlockId: item.headingBlockId,
            content: item.content,
          })),
        });
      });

      if (searchResult.isErr()) {
        return { error: "Failed to search workspace knowledge.", items: [] };
      }

      return searchResult.value;
    },
  });

  const readFullPage = tool({
    description:
      "Read the complete text content of an entire page from start to finish. Use this tool when a search hit points to a document where comprehensive, full-document understanding or sequential reading is needed.",
    inputSchema: readFullPageInputSchema,
    execute: async ({ pageId }) => {
      const pageIdTyped = pageId as PageId;

      const pageResult = await Result.gen(async function* () {
        const page = yield* Result.await(pagesService.getPageById(pageIdTyped));

        if (page.inTrash) {
          return Result.err(
            new Error(
              `Page with ID ${pageId} is in trash and cannot be accessed.`,
            ),
          );
        }

        let rawContent = "";

        const sectionsRes = await searchService.getSectionsByPage(page.id);
        if (sectionsRes.isOk() && sectionsRes.value.length > 0) {
          rawContent = sectionsRes.value
            .map((s) => `## ${s.sectionTitle}\n${s.content}`)
            .join("\n\n");
        } else {
          const contentRes = await pagesService.getPageContent(page.id);
          if (contentRes.isOk() && contentRes.value) {
            const sections = await chunkingService.parseBinaryYDocToSections(
              page.title,
              contentRes.value,
            );
            rawContent = sections
              .map((s) => `## ${s.sectionTitle}\n${s.content}`)
              .join("\n\n");
          }
        }

        if (!rawContent) {
          rawContent = page.title;
        }

        const MAX_PAGE_CHARS = 25000;
        const truncated = rawContent.length > MAX_PAGE_CHARS;
        const finalContent = truncated
          ? `${rawContent.slice(0, MAX_PAGE_CHARS)}\n\n...[Page truncated at ${MAX_PAGE_CHARS} characters]`
          : rawContent;

        let sourceId: number | undefined = undefined;

        if (citations) {
          sourceId = citations.length + 1;
          const citation: AssistantCitation = {
            pageId: page.id,
            pageTitle: page.title,
            sectionTitle: page.title,
            headingBlockId: "root",
          };
          citations.push(citation);
          onCitationCollected?.(citation);
        }

        return Result.ok({
          sourceId,
          pageId: page.id,
          pageTitle: page.title,
          content: finalContent,
          charCount: finalContent.length,
          truncated,
        });
      });

      if (pageResult.isErr()) {
        const errMsg =
          pageResult.error instanceof Error
            ? pageResult.error.message
            : `Page not found with ID ${pageId}.`;
        return {
          error: errMsg,
          pageId: pageIdTyped,
          pageTitle: "",
          content: "",
          charCount: 0,
          truncated: false,
        };
      }

      return pageResult.value;
    },
  });

  const getPageTree = tool({
    description:
      "Retrieve the hierarchical page tree structure of the workspace or under a specific parent page. Use this when the user asks about workspace structure, document organization, subpages, or what pages exist under a topic.",
    inputSchema: getPageTreeInputSchema,
    execute: async ({ rootPageId, maxDepth }) => {
      const treeResult = await Result.gen(async function* () {
        const items = yield* Result.await(
          pagesService.getPageTreeHierarchy(
            workspaceId,
            rootPageId as PageId | undefined,
            maxDepth ?? 3,
          ),
        );
        return Result.ok({ items });
      });

      if (treeResult.isErr()) {
        return { error: "Failed to load workspace page tree.", items: [] };
      }

      return treeResult.value;
    },
  });

  const fetchAdjacentSections = tool({
    description:
      "Retrieve preceding or following adjacent sections around a known section index within a page. Use this when a search result cut off mid-thought, or when surrounding context, preceding steps, or subsequent code blocks are needed.",
    inputSchema: fetchAdjacentSectionsInputSchema,
    execute: async ({ pageId, sectionIndex, direction, count }) => {
      const pageIdTyped = pageId as PageId;
      const adjacentResult = await Result.gen(async function* () {
        const hits = yield* Result.await(
          searchService.getAdjacentSections(
            pageIdTyped,
            sectionIndex,
            count ?? 1,
            direction ?? "both",
          ),
        );

        const startIndex = citations?.length ?? 0;

        if (citations) {
          hits.forEach((hit) => {
            const citation: AssistantCitation = {
              pageId: hit.pageId,
              pageTitle: hit.sectionTitle,
              sectionTitle: hit.sectionTitle,
              headingBlockId: hit.headingBlockId,
            };
            citations.push(citation);
            onCitationCollected?.(citation);
          });
        }

        return Result.ok({
          pageId: pageIdTyped,
          items: hits.map((h, i) => ({
            sourceId: citations ? startIndex + i + 1 : i + 1,
            sectionIndex: h.sectionIndex,
            sectionTitle: h.sectionTitle,
            headingBlockId: h.headingBlockId,
            content: h.content,
          })),
        });
      });

      if (adjacentResult.isErr()) {
        return {
          error: "Failed to retrieve adjacent sections.",
          pageId: pageIdTyped,
          items: [],
        };
      }

      return adjacentResult.value;
    },
  });

  const getPageBlocks = tool({
    description:
      "Inspect structured BlockNote blocks (props, types, checklists, tables, code blocks) of a page under a specific headingBlockId or by block IDs. Use this for deep inspection of tables, code blocks, checklists, or nested block hierarchies.",
    inputSchema: getPageBlocksInputSchema,
    execute: async ({ pageId, headingBlockId, blockIds }) => {
      const pageIdTyped = pageId as PageId;
      const blocksResult = await Result.gen(async function* () {
        const page = yield* Result.await(pagesService.getPageById(pageIdTyped));

        if (page.inTrash) {
          return Result.err(
            new Error(
              `Page with ID ${pageId} is in trash and cannot be accessed.`,
            ),
          );
        }

        const contentBinary = yield* Result.await(
          pagesService.getPageContent(pageIdTyped),
        );

        if (!contentBinary) {
          return Result.ok({ pageId: pageIdTyped, blocks: [] });
        }

        let allBlocks: BlockNoteBlock[] = [];
        try {
          const ydoc = new Y.Doc();
          Y.applyUpdate(ydoc, contentBinary);
          allBlocks = chunkingService.parseYDocBlocks(ydoc);
        } catch (e) {
          console.error("getPageBlocks: failed to parse Y.Doc:", e);
          return Result.err(new Error("Failed to parse page Y.Doc structure."));
        }

        const flatBlocks: Array<{
          block: BlockNoteBlock;
          headingScopeId?: string;
        }> = [];

        let currentHeadingId: string | undefined = undefined;

        const flatten = (nodes: BlockNoteBlock[]) => {
          for (const node of nodes) {
            const blockType = (node.type ?? "paragraph").toLowerCase();
            if (blockType === "heading" && node.id) {
              currentHeadingId = node.id;
            }
            flatBlocks.push({
              block: node,
              headingScopeId: currentHeadingId,
            });
            if (node.children && node.children.length > 0) {
              flatten(node.children);
            }
          }
        };
        flatten(allBlocks);

        let filtered = flatBlocks;

        if (headingBlockId) {
          filtered = flatBlocks.filter(
            (item) =>
              item.headingScopeId === headingBlockId ||
              item.block.id === headingBlockId,
          );
        } else if (blockIds && blockIds.length > 0) {
          const idSet = new Set(blockIds);
          filtered = flatBlocks.filter(
            (item) => item.block.id && idSet.has(item.block.id),
          );
        }

        const bounded = filtered.slice(0, 30);

        const structuredBlocks = bounded.map(({ block }) => ({
          id: block.id ?? "unknown",
          type: block.type ?? "paragraph",
          props: (block.props as Record<string, unknown>) ?? undefined,
          contentText: chunkingService.extractInlineText(block.content),
          childrenCount: block.children?.length ?? 0,
        }));

        return Result.ok({
          pageId: pageIdTyped,
          blocks: structuredBlocks,
        });
      });

      if (blocksResult.isErr()) {
        const errMsg =
          blocksResult.error instanceof Error
            ? blocksResult.error.message
            : `Page with ID ${pageId} not found or is in trash.`;
        return {
          error: errMsg,
          pageId: pageIdTyped,
          blocks: [],
        };
      }

      return blocksResult.value;
    },
  });

  return {
    searchWorkspace,
    readFullPage,
    getPageTree,
    fetchAdjacentSections,
    getPageBlocks,
  };
}
