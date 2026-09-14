import { Result } from "better-result";
import type { SearchRepository, SearchHit } from "@dotion/db/repositories";
import type { EmbeddingService, EmbeddingError } from "./embedding.service";
import type { ChunkingService, ParsedSection } from "./chunking.service";
import type { PagesService } from "./pages.service";
import type { DBClient } from "@dotion/db";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { PageId } from "@dotion/shared/pages/types";
import type { PageSectionId } from "@dotion/shared/ids";
import type { PaginatedData } from "@dotion/shared/pagination/types";
import type {
  SearchResultItem,
  CreatePageSectionInput,
  UpdatePageSectionInput,
  PageSectionMeta,
  PageSection,
  IndexPageResult,
  SearchMode,
} from "@dotion/shared/search/types";
import type { DatabaseError, NotFoundError } from "@dotion/db/errors";

export const SEARCH_MODE_WEIGHTS: Record<
  SearchMode,
  { vector: number; bm25: number }
> = {
  conceptual: { vector: 0.8, bm25: 0.2 },
  balanced: { vector: 0.65, bm25: 0.35 },
  exact: { vector: 0.2, bm25: 0.8 },
} as const;

export class SearchService {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly chunkingService: ChunkingService,
    private readonly pagesService: PagesService,
    private readonly dbClient: DBClient,
  ) {}

  async getPageSectionsMeta({
    pageId,
  }: {
    pageId: PageId;
  }): Promise<Result<PageSectionMeta[], DatabaseError>> {
    return this.searchRepository.getPageSectionsMeta({ pageId });
  }

  async getSectionsByPage({
    pageId,
  }: {
    pageId: PageId;
  }): Promise<Result<PageSection[], DatabaseError>> {
    return this.searchRepository.getSectionsByPage({ pageId });
  }

  async getAdjacentSections({
    pageId,
    sectionIndex,
    count = 1,
    direction = "both",
  }: {
    pageId: PageId;
    sectionIndex: number;
    count?: number;
    direction?: "prev" | "next" | "both";
  }): Promise<Result<SearchHit[], DatabaseError>> {
    return this.searchRepository.getAdjacentSections({
      pageId,
      sectionIndex,
      count,
      direction,
    });
  }

  async syncPageSections(input: {
    toInsert: CreatePageSectionInput[];
    toUpdate: UpdatePageSectionInput[];
    toDeleteIds: PageSectionId[];
  }): Promise<Result<void, DatabaseError>> {
    return this.dbClient.transaction(async (tx) => {
      return Result.gen(async function* (this: SearchService) {
        if (input.toDeleteIds.length > 0) {
          yield* Result.await(
            this.searchRepository.deletePageSectionsTx({
              tx,
              ids: input.toDeleteIds,
            }),
          );
        }

        if (input.toInsert.length > 0) {
          yield* Result.await(
            this.searchRepository.insertPageSectionsTx({
              tx,
              sections: input.toInsert,
            }),
          );
        }

        if (input.toUpdate.length > 0) {
          yield* Result.await(
            Result.allAsync(
              input.toUpdate.map((update) =>
                this.searchRepository.updatePageSectionTx({
                  tx,
                  id: update.id,
                  data: update,
                }),
              ),
            ),
          );
        }

        return Result.ok(undefined);
      }, this).then(
        Result.tapError(() => {
          tx.rollback();
        }),
      );
    });
  }

  async indexPage(params: {
    workspaceId: WorkspaceId;
    pageId: PageId;
  }): Promise<
    Result<IndexPageResult, DatabaseError | EmbeddingError | NotFoundError>
  > {
    return Result.gen(async function* (this: SearchService) {
      const [pageResult, contentBinaryResult, existingMetaResult] =
        await Promise.all([
          this.pagesService.getPageById({ pageId: params.pageId }),
          this.pagesService.getPageContent({ pageId: params.pageId }),
          this.searchRepository.getPageSectionsMeta({ pageId: params.pageId }),
        ]);

      const page = yield* pageResult;
      const existingMeta = yield* existingMetaResult;
      const contentBinary = yield* contentBinaryResult;

      const sections = await this.chunkingService.parseBinaryYDocToSections({
        pageTitle: page.title,
        contentBinary,
      });

      const existingMapByHeading = new Map<string, PageSectionMeta>();
      const existingMapByHashList = new Map<string, PageSectionMeta[]>();
      for (const meta of existingMeta) {
        existingMapByHeading.set(meta.headingBlockId, meta);
        const list = existingMapByHashList.get(meta.contentHash) ?? [];
        list.push(meta);
        existingMapByHashList.set(meta.contentHash, list);
      }

      const seenExistingIds = new Set<PageSectionId>();
      const toInsertSections: Array<{ section: ParsedSection; text: string }> =
        [];
      const toUpdateContentSections: Array<{
        id: PageSectionId;
        section: ParsedSection;
        text: string;
      }> = [];
      const toUpdateMetaSections: UpdatePageSectionInput[] = [];

      sections.forEach((s) => {
        const sectionText = `${page.title} > ${s.sectionTitle}\n${s.content}`;

        let existing = existingMapByHeading.get(s.headingBlockId);
        if (!existing && existingMapByHashList.has(s.contentHash)) {
          const candidates = existingMapByHashList.get(s.contentHash)!;
          existing = candidates.find((c) => !seenExistingIds.has(c.id));
        }

        if (!existing) {
          toInsertSections.push({ section: s, text: sectionText });
        } else {
          seenExistingIds.add(existing.id);

          if (existing.contentHash !== s.contentHash) {
            toUpdateContentSections.push({
              id: existing.id,
              section: s,
              text: sectionText,
            });
          } else if (
            existing.sectionIndex !== s.sectionIndex ||
            existing.sectionTitle !== s.sectionTitle
          ) {
            toUpdateMetaSections.push({
              id: existing.id,
              sectionIndex: s.sectionIndex,
              sectionTitle: s.sectionTitle,
              blockIds: s.blockIds,
            });
          }
        }
      });

      const toDeleteIds: PageSectionId[] = [];
      for (const meta of existingMeta) {
        if (!seenExistingIds.has(meta.id)) {
          toDeleteIds.push(meta.id);
        }
      }

      const totalNeedingEmbed =
        toInsertSections.length + toUpdateContentSections.length;
      const isNoOp =
        totalNeedingEmbed === 0 &&
        toUpdateMetaSections.length === 0 &&
        toDeleteIds.length === 0;

      if (isNoOp) {
        return Result.ok({
          pageId: params.pageId,
          inserted: 0,
          updatedContent: 0,
          updatedMeta: 0,
          deleted: 0,
          unchanged: sections.length,
        });
      }

      const textsToEmbed = [
        ...toInsertSections.map((item) => item.text),
        ...toUpdateContentSections.map((item) => item.text),
      ];

      let generatedEmbeddings: number[][] = [];
      if (textsToEmbed.length > 0) {
        generatedEmbeddings = yield* Result.await(
          this.embeddingService.embedBatch({
            texts: textsToEmbed,
            taskType: "RETRIEVAL_DOCUMENT",
          }),
        );
      }

      const toInsertInputs: CreatePageSectionInput[] = toInsertSections.map(
        ({ section }, i) => ({
          workspaceId: params.workspaceId,
          pageId: params.pageId,
          sectionIndex: section.sectionIndex,
          sectionTitle: section.sectionTitle,
          headingBlockId: section.headingBlockId,
          blockIds: section.blockIds,
          content: section.content,
          contentHash: section.contentHash,
          embedding: generatedEmbeddings[i] ?? [],
        }),
      );

      const toUpdateInputs: UpdatePageSectionInput[] = [
        ...toUpdateContentSections.map(({ id, section }, i) => ({
          id,
          sectionIndex: section.sectionIndex,
          sectionTitle: section.sectionTitle,
          blockIds: section.blockIds,
          content: section.content,
          contentHash: section.contentHash,
          embedding: generatedEmbeddings[toInsertSections.length + i] ?? [],
        })),
        ...toUpdateMetaSections,
      ];

      yield* Result.await(
        this.syncPageSections({
          toInsert: toInsertInputs,
          toUpdate: toUpdateInputs,
          toDeleteIds,
        }),
      );

      return Result.ok({
        pageId: params.pageId,
        inserted: toInsertInputs.length,
        updatedContent: toUpdateContentSections.length,
        updatedMeta: toUpdateMetaSections.length,
        deleted: toDeleteIds.length,
        unchanged:
          sections.length - totalNeedingEmbed - toUpdateMetaSections.length,
      });
    }, this);
  }

  private reciprocalRankFusion(
    bm25Hits: SearchHit[],
    vectorHits: SearchHit[],
    options: {
      k?: number;
      weights?: { bm25?: number; vector?: number };
    } = {},
  ): Array<{ hit: SearchHit; score: number }> {
    const k = options.k ?? 60;
    let wBm25 = options.weights?.bm25 ?? 0.35;
    let wVector = options.weights?.vector ?? 0.65;

    if (bm25Hits.length === 0 && vectorHits.length > 0) {
      wVector = 1.0;
      wBm25 = 0;
    } else if (vectorHits.length === 0 && bm25Hits.length > 0) {
      wBm25 = 1.0;
      wVector = 0;
    }

    const scoreMap = new Map<string, { hit: SearchHit; score: number }>();

    bm25Hits.forEach((hit, rank) => {
      const rrfScore = wBm25 * (1 / (k + rank + 1));
      scoreMap.set(hit.sectionId, {
        hit,
        score: rrfScore,
      });
    });

    vectorHits.forEach((hit, rank) => {
      const rrfScore = wVector * (1 / (k + rank + 1));
      const existing = scoreMap.get(hit.sectionId);
      if (existing) {
        existing.score += rrfScore;
      } else {
        scoreMap.set(hit.sectionId, {
          hit,
          score: rrfScore,
        });
      }
    });

    return Array.from(scoreMap.values()).sort((a, b) => b.score - a.score);
  }

  async hybridSearch(params: {
    workspaceId: WorkspaceId;
    query: string;
    page?: number;
    limit?: number;
    mode?: SearchMode;
  }): Promise<
    Result<PaginatedData<SearchResultItem>, DatabaseError | EmbeddingError>
  > {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.max(1, params.limit ?? 20);
    const query = params.query.trim();

    if (!query) {
      return Result.ok({
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false,
        },
        payload: [],
      });
    }

    const effectiveWeights = SEARCH_MODE_WEIGHTS[params.mode ?? "balanced"];

    return Result.gen(async function* (this: SearchService) {
      const [trashedPages, queryEmbedding] = yield* Result.await(
        Result.allAsync([
          this.pagesService.getTrashedPages({
            workspaceId: params.workspaceId,
          }),
          this.embeddingService.embedText({
            text: query,
            taskType: "RETRIEVAL_QUERY",
          }),
        ]),
      );

      const excludedPageIds = trashedPages.map((p) => p.id);
      const searchOptions = {
        ...(excludedPageIds.length > 0 ? { excludedPageIds } : {}),
        minScore: 1.0,
      };

      const candidateDepth = Math.max(40, page * limit * 2);

      const [bm25Hits, vectorHits] = yield* Result.await(
        Result.allAsync([
          this.searchRepository.searchBM25({
            workspaceId: params.workspaceId,
            query,
            limit: candidateDepth,
            options: searchOptions,
          }),
          this.searchRepository.searchVector({
            workspaceId: params.workspaceId,
            queryEmbedding,
            limit: candidateDepth,
            minSimilarity: 0.5,
            options: searchOptions,
          }),
        ]),
      );

      // Standalone BM25 Gating:
      // If vector search found 0 hits (no section in the workspace reached semantic similarity >= 0.50),
      // only accept BM25 hits if they represent a high-confidence exact match (score >= 3.0).
      let effectiveBm25Hits = bm25Hits;
      if (vectorHits.length === 0) {
        const MIN_STANDALONE_BM25_SCORE = 3.0;
        effectiveBm25Hits = bm25Hits.filter(
          (hit) => hit.score >= MIN_STANDALONE_BM25_SCORE,
        );
      }

      const fused = this.reciprocalRankFusion(effectiveBm25Hits, vectorHits, {
        weights: effectiveWeights,
      });

      if (fused.length === 0) {
        return Result.ok({
          pagination: {
            page,
            limit,
            total: 0,
            hasMore: false,
          },
          payload: [],
        });
      }

      const total = fused.length;
      const offset = (page - 1) * limit;
      const pagedFused = fused.slice(offset, offset + limit);
      const hasMore = offset + limit < total;

      if (pagedFused.length === 0) {
        return Result.ok({
          pagination: {
            page,
            limit,
            total,
            hasMore: false,
          },
          payload: [],
        });
      }

      const pagedUniquePageIds = Array.from(
        new Set(pagedFused.map((item) => item.hit.pageId)),
      );

      const pages = yield* Result.await(
        this.pagesService.getPagesByIds({ pageIds: pagedUniquePageIds }),
      );

      const pageMap = new Map<PageId, { title: string; icon: string | null }>();

      pages.forEach((p) => {
        pageMap.set(p.id, {
          title: p.title,
          icon: p.icon ?? null,
        });
      });

      const finalItems: SearchResultItem[] = pagedFused.map(
        ({ hit, score }) => {
          const pageInfo = pageMap.get(hit.pageId);
          return {
            sectionId: hit.sectionId,
            pageId: hit.pageId,
            workspaceId: hit.workspaceId,
            sectionIndex: hit.sectionIndex,
            sectionTitle: hit.sectionTitle,
            headingBlockId: hit.headingBlockId,
            content: hit.content,
            score,
            pageTitle: pageInfo?.title ?? "Untitled",
            pageIcon: pageInfo?.icon ?? null,
          };
        },
      );

      return Result.ok({
        pagination: {
          page,
          limit,
          total,
          hasMore,
        },
        payload: finalItems,
      });
    }, this);
  }
}
