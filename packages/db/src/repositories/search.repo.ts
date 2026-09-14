import type { AppDB, DBClient } from "../index";
import { pageSections } from "../schema";
import {
  and,
  eq,
  gt,
  gte,
  lt,
  lte,
  ne,
  inArray,
  notInArray,
  sql,
  cosineDistance,
} from "drizzle-orm";
import { Result } from "better-result";
import { DatabaseError } from "../errors";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { PageId } from "@dotion/shared/pages/types";
import type { PageSectionId } from "@dotion/shared/ids";
import type {
  CreatePageSectionInput,
  UpdatePageSectionInput,
  PageSectionMeta,
  PageSection,
} from "@dotion/shared/search/types";

export interface SearchHit {
  sectionId: PageSectionId;
  pageId: PageId;
  workspaceId: WorkspaceId;
  sectionIndex: number;
  sectionTitle: string;
  headingBlockId: string;
  blockIds: string[];
  content: string;
  score: number;
}

export class SearchRepository {
  constructor(private readonly db: DBClient) {}

  async getPageSectionsMeta({
    pageId,
  }: {
    pageId: PageId;
  }): Promise<Result<PageSectionMeta[], DatabaseError>> {
    try {
      const rows = await this.db
        .select({
          id: pageSections.id,
          headingBlockId: pageSections.headingBlockId,
          contentHash: pageSections.contentHash,
          sectionIndex: pageSections.sectionIndex,
          sectionTitle: pageSections.sectionTitle,
          blockIds: pageSections.blockIds,
        })
        .from(pageSections)
        .where(eq(pageSections.pageId, pageId));

      return Result.ok(rows as PageSectionMeta[]);
    } catch (error) {
      console.error("SearchRepository.getPageSectionsMeta error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to load page section metadata" }),
      );
    }
  }

  async getSectionsByPage({
    pageId,
  }: {
    pageId: PageId;
  }): Promise<Result<PageSection[], DatabaseError>> {
    try {
      const rows = await this.db
        .select()
        .from(pageSections)
        .where(eq(pageSections.pageId, pageId))
        .orderBy(pageSections.sectionIndex);

      return Result.ok(rows as PageSection[]);
    } catch (error) {
      console.error("SearchRepository.getSectionsByPage error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to load page sections" }),
      );
    }
  }

  async insertPageSections({
    sections,
  }: {
    sections: CreatePageSectionInput[];
  }): Promise<Result<void, DatabaseError>> {
    return this.insertPageSectionsTx({ tx: this.db, sections });
  }

  async insertPageSectionsTx({
    tx,
    sections,
  }: {
    tx: AppDB;
    sections: CreatePageSectionInput[];
  }): Promise<Result<void, DatabaseError>> {
    if (sections.length === 0) return Result.ok(undefined);
    try {
      await tx.insert(pageSections).values(sections);
      return Result.ok(undefined);
    } catch (error) {
      console.error("SearchRepository.insertPageSections error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to insert page sections" }),
      );
    }
  }

  async updatePageSection({
    id,
    data,
  }: {
    id: PageSectionId;
    data: Partial<UpdatePageSectionInput>;
  }): Promise<Result<void, DatabaseError>> {
    return this.updatePageSectionTx({ tx: this.db, id, data });
  }

  async updatePageSectionTx({
    tx,
    id,
    data,
  }: {
    tx: AppDB;
    id: PageSectionId;
    data: Partial<UpdatePageSectionInput>;
  }): Promise<Result<void, DatabaseError>> {
    try {
      const updateValues: Partial<typeof pageSections.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (data.sectionIndex !== undefined) {
        updateValues.sectionIndex = data.sectionIndex;
      }
      if (data.sectionTitle !== undefined) {
        updateValues.sectionTitle = data.sectionTitle;
      }
      if (data.blockIds !== undefined) {
        updateValues.blockIds = data.blockIds;
      }
      if (data.content !== undefined) {
        updateValues.content = data.content;
      }
      if (data.contentHash !== undefined) {
        updateValues.contentHash = data.contentHash;
      }
      if (data.embedding !== undefined) {
        updateValues.embedding = data.embedding;
      }

      await tx
        .update(pageSections)
        .set(updateValues)
        .where(eq(pageSections.id, id));

      return Result.ok(undefined);
    } catch (error) {
      console.error("SearchRepository.updatePageSection error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to update page section" }),
      );
    }
  }

  async deletePageSections({
    ids,
  }: {
    ids: PageSectionId[];
  }): Promise<Result<void, DatabaseError>> {
    return this.deletePageSectionsTx({ tx: this.db, ids });
  }

  async deletePageSectionsTx({
    tx,
    ids,
  }: {
    tx: AppDB;
    ids: PageSectionId[];
  }): Promise<Result<void, DatabaseError>> {
    if (ids.length === 0) return Result.ok(undefined);
    try {
      await tx.delete(pageSections).where(inArray(pageSections.id, ids));
      return Result.ok(undefined);
    } catch (error) {
      console.error("SearchRepository.deletePageSections error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to delete page sections" }),
      );
    }
  }

  async searchBM25({
    workspaceId,
    query,
    limit = 20,
    options,
  }: {
    workspaceId: WorkspaceId;
    query: string;
    limit?: number;
    options?: { excludedPageIds?: PageId[]; minScore?: number };
  }): Promise<Result<SearchHit[], DatabaseError>> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return Result.ok([]);

      const sanitizedQuery = trimmedQuery
        .replace(/[^\p{L}\p{N}\s_\-\."']/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!sanitizedQuery) return Result.ok([]);

      const minScore = options?.minScore ?? 1.0;

      const whereConditions = [
        eq(pageSections.workspaceId, workspaceId),
        gt(
          sql<number>`-1 * (${pageSections.textVector} <@> to_bm25query(to_tsvector('simple', ${sanitizedQuery}), 'idx_page_sections_bm25'))`,
          minScore,
        ),
      ];
      if (options?.excludedPageIds && options.excludedPageIds.length > 0) {
        whereConditions.push(
          notInArray(pageSections.pageId, options.excludedPageIds),
        );
      }

      const rows = await this.db
        .select({
          sectionId: pageSections.id,
          pageId: pageSections.pageId,
          workspaceId: pageSections.workspaceId,
          sectionIndex: pageSections.sectionIndex,
          sectionTitle: pageSections.sectionTitle,
          headingBlockId: pageSections.headingBlockId,
          blockIds: pageSections.blockIds,
          content: pageSections.content,
          score: sql<number>`-1 * (${pageSections.textVector} <@> to_bm25query(to_tsvector('simple', ${sanitizedQuery}), 'idx_page_sections_bm25'))`,
        })
        .from(pageSections)
        .where(and(...whereConditions))
        .orderBy(
          sql`${pageSections.textVector} <@> to_bm25query(to_tsvector('simple', ${sanitizedQuery}), 'idx_page_sections_bm25') ASC`,
        )
        .limit(limit);

      return Result.ok(rows as SearchHit[]);
    } catch (error) {
      console.error("SearchRepository.searchBM25 error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to execute BM25 search" }),
      );
    }
  }

  async searchVector({
    workspaceId,
    queryEmbedding,
    limit = 20,
    minSimilarity = 0.5,
    options,
  }: {
    workspaceId: WorkspaceId;
    queryEmbedding: number[];
    limit?: number;
    minSimilarity?: number;
    options?: { excludedPageIds?: PageId[] };
  }): Promise<Result<SearchHit[], DatabaseError>> {
    try {
      const whereConditions = [
        eq(pageSections.workspaceId, workspaceId),
        gt(
          sql`1 - (${cosineDistance(pageSections.embedding, queryEmbedding)})`,
          minSimilarity,
        ),
      ];
      if (options?.excludedPageIds && options.excludedPageIds.length > 0) {
        whereConditions.push(
          notInArray(pageSections.pageId, options.excludedPageIds),
        );
      }

      const rows = await this.db
        .select({
          sectionId: pageSections.id,
          pageId: pageSections.pageId,
          workspaceId: pageSections.workspaceId,
          sectionIndex: pageSections.sectionIndex,
          sectionTitle: pageSections.sectionTitle,
          headingBlockId: pageSections.headingBlockId,
          blockIds: pageSections.blockIds,
          content: pageSections.content,
          score:
            sql<number>`1 - (${cosineDistance(pageSections.embedding, queryEmbedding)})`.as(
              "score",
            ),
        })
        .from(pageSections)
        .where(and(...whereConditions))
        .orderBy(sql`score DESC`)
        .limit(limit);

      return Result.ok(rows as SearchHit[]);
    } catch (error) {
      console.error("SearchRepository.searchVector error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to execute vector search" }),
      );
    }
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
    try {
      let condition;
      if (direction === "prev") {
        condition = and(
          eq(pageSections.pageId, pageId),
          gte(pageSections.sectionIndex, Math.max(0, sectionIndex - count)),
          lt(pageSections.sectionIndex, sectionIndex),
        );
      } else if (direction === "next") {
        condition = and(
          eq(pageSections.pageId, pageId),
          gt(pageSections.sectionIndex, sectionIndex),
          lte(pageSections.sectionIndex, sectionIndex + count),
        );
      } else {
        condition = and(
          eq(pageSections.pageId, pageId),
          gte(pageSections.sectionIndex, Math.max(0, sectionIndex - count)),
          lte(pageSections.sectionIndex, sectionIndex + count),
          ne(pageSections.sectionIndex, sectionIndex),
        );
      }

      const rows = await this.db
        .select({
          sectionId: pageSections.id,
          pageId: pageSections.pageId,
          workspaceId: pageSections.workspaceId,
          sectionIndex: pageSections.sectionIndex,
          sectionTitle: pageSections.sectionTitle,
          headingBlockId: pageSections.headingBlockId,
          blockIds: pageSections.blockIds,
          content: pageSections.content,
          score: sql<number>`1.0`,
        })
        .from(pageSections)
        .where(condition)
        .orderBy(pageSections.sectionIndex);

      return Result.ok(rows as SearchHit[]);
    } catch (error) {
      console.error("SearchRepository.getAdjacentSections error:", error);
      return Result.err(
        new DatabaseError({
          message: "Failed to fetch adjacent page sections",
        }),
      );
    }
  }
}
