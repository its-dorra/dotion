import type { AppDB, DBClient } from "../index";
import { pageSections } from "../schema";
import { and, desc, eq, inArray, sql, cosineDistance } from "drizzle-orm";
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

  async getPageSectionsMeta(
    pageId: PageId,
  ): Promise<Result<PageSectionMeta[], DatabaseError>> {
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

  async getSectionsByPage(
    pageId: PageId,
  ): Promise<Result<PageSection[], DatabaseError>> {
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

  async insertPageSections(
    tx: AppDB,
    sections: CreatePageSectionInput[],
  ): Promise<Result<void, DatabaseError>> {
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

  async updatePageSection(
    tx: AppDB,
    id: PageSectionId,
    data: Partial<UpdatePageSectionInput>,
  ): Promise<Result<void, DatabaseError>> {
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

  async deletePageSections(
    tx: AppDB,
    ids: PageSectionId[],
  ): Promise<Result<void, DatabaseError>> {
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

  async deletePageSectionsByPage(
    tx: AppDB,
    pageId: PageId,
  ): Promise<Result<void, DatabaseError>> {
    try {
      await tx.delete(pageSections).where(eq(pageSections.pageId, pageId));
      return Result.ok(undefined);
    } catch (error) {
      console.error("SearchRepository.deletePageSectionsByPage error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to delete page sections" }),
      );
    }
  }

  async searchBM25(
    workspaceId: WorkspaceId,
    query: string,
    limit: number = 20,
  ): Promise<Result<SearchHit[], DatabaseError>> {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return Result.ok([]);

      const sanitizedQuery = trimmedQuery
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .trim();
      if (!sanitizedQuery) return Result.ok([]);

      // lakebase_text BM25 ranking query using <@> operator and to_bm25query
      // <@> computes the negative BM25 score against the 'idx_page_sections_bm25' index.
      // Ordering ASC returns the most relevant documents first.
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
        .where(eq(pageSections.workspaceId, workspaceId))
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

  async searchVector(
    workspaceId: WorkspaceId,
    queryEmbedding: number[],
    limit: number = 20,
    minSimilarity: number = 0.25,
  ): Promise<Result<SearchHit[], DatabaseError>> {
    try {
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
          score: sql<number>`1 - (${cosineDistance(pageSections.embedding, queryEmbedding)})`,
        })
        .from(pageSections)
        .where(
          and(
            eq(pageSections.workspaceId, workspaceId),
            sql`1 - (${cosineDistance(pageSections.embedding, queryEmbedding)}) > ${minSimilarity}`,
          ),
        )
        .orderBy((t) => desc(t.score))
        .limit(limit);

      return Result.ok(rows as SearchHit[]);
    } catch (error) {
      console.error("SearchRepository.searchVector error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to execute vector search" }),
      );
    }
  }
}
