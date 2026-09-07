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
  IndexPageResult,
  SearchMode,
} from "@dotion/shared/search/types";
import type { DatabaseError, NotFoundError } from "@dotion/db/errors";

export const SEARCH_MODE_WEIGHTS: Record<
  SearchMode,
  { vector: number; bm25: number }
> = {
  // Explanations, how-tos, summaries in any language (Assistant / Editor AI)
  conceptual: { vector: 0.8, bm25: 0.2 },
  // Default interactive search (SearchDialog, general queries)
  balanced: { vector: 0.65, bm25: 0.35 },
  // Quoted phrases, code symbols, error codes, identifiers
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

  async getPageSectionsMeta(
    pageId: PageId,
  ): Promise<Result<PageSectionMeta[], DatabaseError>> {
    return this.searchRepository.getPageSectionsMeta(pageId);
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
            this.searchRepository.deletePageSections(tx, input.toDeleteIds),
          );
        }

        if (input.toInsert.length > 0) {
          yield* Result.await(
            this.searchRepository.insertPageSections(tx, input.toInsert),
          );
        }

        for (const update of input.toUpdate) {
          yield* Result.await(
            this.searchRepository.updatePageSection(tx, update.id, update),
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
          this.pagesService.getPageById(params.pageId),
          this.pagesService.getPageContent(params.pageId),
          this.searchRepository.getPageSectionsMeta(params.pageId),
        ]);

      const page = yield* pageResult;
      const existingMeta = yield* existingMetaResult;
      const contentBinary = yield* contentBinaryResult;

      const sections = await this.chunkingService.parseBinaryYDocToSections(
        page.title,
        contentBinary,
      );

      const existingMapByHeading = new Map<string, PageSectionMeta>();
      const existingMapByHash = new Map<string, PageSectionMeta>();
      for (const meta of existingMeta) {
        existingMapByHeading.set(meta.headingBlockId, meta);
        existingMapByHash.set(meta.contentHash, meta);
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
        if (!existing && existingMapByHash.has(s.contentHash)) {
          const candidate = existingMapByHash.get(s.contentHash)!;
          if (!seenExistingIds.has(candidate.id)) {
            existing = candidate;
          }
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
          this.embeddingService.embedBatch(textsToEmbed, "RETRIEVAL_DOCUMENT"),
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

    // Cross-lingual / Zero-Candidate Normalization:
    // If one retriever produced 0 candidates (e.g. cross-lingual search where BM25 has no lexical overlap),
    // allocate full 1.0 weight to the active retriever so cross-lingual results aren't artificially deflated.
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
      const queryEmbedding = yield* Result.await(
        this.embeddingService.embedText(query, "RETRIEVAL_QUERY"),
      );

      const candidateDepth = Math.max(40, page * limit * 2);

      const [bm25Hits, vectorHits] = yield* Result.await(
        Result.allAsync([
          this.searchRepository.searchBM25(
            params.workspaceId,
            query,
            candidateDepth,
          ),
          this.searchRepository.searchVector(
            params.workspaceId,
            queryEmbedding,
            candidateDepth,
          ),
        ]),
      );

      const fused = this.reciprocalRankFusion(bm25Hits, vectorHits, {
        weights: effectiveWeights,
      });

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

      const uniquePageIds = Array.from(
        new Set(pagedFused.map((item) => item.hit.pageId)),
      );

      const pages = yield* Result.await(
        this.pagesService.getPagesByIds(uniquePageIds),
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
