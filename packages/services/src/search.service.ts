import { Result } from "better-result";
import type { SearchRepository, SearchHit } from "@dotion/db/repositories";
import type { EmbeddingService } from "./embedding.service";
import type { PagesService } from "./pages.service";
import type { DBClient } from "@dotion/db";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { PageId } from "@dotion/shared/pages/types";
import type { SearchResultItem } from "@dotion/shared/search/types";
import type { DatabaseError } from "@dotion/db/errors";
import type { EmbeddingError } from "./embedding.service";

export class SearchService {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly embeddingService: EmbeddingService,
    private readonly pagesService: PagesService,
    private readonly dbClient: DBClient,
  ) {}

  /**
   * Reciprocal Rank Fusion (RRF) to merge BM25 and Vector search results
   */
  private reciprocalRankFusion(
    bm25Hits: SearchHit[],
    vectorHits: SearchHit[],
    k: number = 60,
  ): Array<{ hit: SearchHit; score: number }> {
    const scoreMap = new Map<string, { hit: SearchHit; score: number }>();

    bm25Hits.forEach((hit, rank) => {
      const rrfScore = 1 / (k + rank + 1);
      scoreMap.set(hit.sectionId, {
        hit,
        score: rrfScore,
      });
    });

    vectorHits.forEach((hit, rank) => {
      const rrfScore = 1 / (k + rank + 1);
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
    limit?: number;
  }): Promise<Result<SearchResultItem[], DatabaseError | EmbeddingError>> {
    const limit = params.limit ?? 20;
    const query = params.query.trim();

    if (!query) {
      return Result.ok([]);
    }

    return Result.gen(async function* (this: SearchService) {
      // 1. Generate query embedding
      const queryEmbedding = yield* Result.await(
        this.embeddingService.embedText(query),
      );

      // 2. Concurrently execute lexical BM25 and semantic Vector searches
      const [bm25Hits, vectorHits] = yield* Result.await(
        Result.allAsync([
          this.searchRepository.searchBM25(
            params.workspaceId,
            query,
            limit * 2,
          ),
          this.searchRepository.searchVector(
            params.workspaceId,
            queryEmbedding,
            limit * 2,
          ),
        ]),
      );

      // 3. Merge rankings with Reciprocal Rank Fusion
      const fused = this.reciprocalRankFusion(bm25Hits, vectorHits).slice(
        0,
        limit,
      );

      if (fused.length === 0) {
        return Result.ok([]);
      }

      // 4. Enrich results with page titles and icons via PagesService
      const uniquePageIds = Array.from(
        new Set(fused.map((item) => item.hit.pageId)),
      );

      const pageLookups = yield* Result.await(
        Result.allAsync(
          uniquePageIds.map((pageId) => this.pagesService.getPageById(pageId)),
        ).then(
          Result.match({
            ok: (pages) => Result.ok(pages),
            err: () => Result.ok([]),
          }),
        ),
      );

      const pageMap = new Map<PageId, { title: string; icon: string | null }>();

      pageLookups.forEach((page) => {
        pageMap.set(page.id, {
          title: page.title,
          icon: page.icon ?? null,
        });
      });

      const finalItems: SearchResultItem[] = fused.map(({ hit, score }) => {
        const pageInfo = pageMap.get(hit.pageId);
        return {
          sectionId: hit.sectionId,
          pageId: hit.pageId,
          workspaceId: hit.workspaceId,
          sectionIndex: hit.sectionIndex,
          sectionTitle: hit.sectionTitle,
          headingBlockId: hit.headingBlockId,
          content: hit.content,
          score: Math.round(score * 10000) / 10000,
          pageTitle: pageInfo?.title ?? "Untitled",
          pageIcon: pageInfo?.icon ?? null,
        };
      });

      return Result.ok(finalItems);
    }, this);
  }

  async indexPageSections(
    workspaceId: WorkspaceId,
    pageId: PageId,
    sections: Array<{
      sectionIndex: number;
      sectionTitle: string;
      headingBlockId: string;
      blockIds: string[];
      content: string;
      contentHash: string;
      embedding: number[];
    }>,
  ): Promise<Result<void, DatabaseError>> {
    const inputs = sections.map((s) => ({
      workspaceId,
      pageId,
      sectionIndex: s.sectionIndex,
      sectionTitle: s.sectionTitle,
      headingBlockId: s.headingBlockId,
      blockIds: s.blockIds,
      content: s.content,
      contentHash: s.contentHash,
      embedding: s.embedding,
    }));

    return this.dbClient.transaction(async (tx) => {
      return this.searchRepository.replacePageSections(tx, pageId, inputs);
    });
  }
}
