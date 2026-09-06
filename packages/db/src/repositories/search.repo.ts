import type { AppDB, DBClient } from "../index";
import { pageSections } from "../schema";
import { desc, eq, sql, cosineDistance } from "drizzle-orm";
import { Result } from "better-result";
import { DatabaseError } from "../errors";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { PageId } from "@dotion/shared/pages/types";
import type { PageSectionId } from "@dotion/shared/ids";

export interface PageSectionRecord {
  id: PageSectionId;
  workspaceId: WorkspaceId;
  pageId: PageId;
  sectionIndex: number;
  sectionTitle: string;
  headingBlockId: string;
  blockIds: string[];
  content: string;
  contentHash: string;
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePageSectionInput {
  workspaceId: WorkspaceId;
  pageId: PageId;
  sectionIndex: number;
  sectionTitle: string;
  headingBlockId: string;
  blockIds: string[];
  content: string;
  contentHash: string;
  embedding: number[];
}

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

  async getSectionsByPage(
    pageId: PageId,
  ): Promise<Result<PageSectionRecord[], DatabaseError>> {
    try {
      const rows = await this.db
        .select()
        .from(pageSections)
        .where(eq(pageSections.pageId, pageId))
        .orderBy(pageSections.sectionIndex);

      return Result.ok(rows as PageSectionRecord[]);
    } catch (error) {
      console.error("SearchRepository.getSectionsByPage error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to load page sections" }),
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
          score: sql<number>`-1 * (${pageSections.textVector} <@> to_bm25query(to_tsvector('english', ${trimmedQuery}), 'idx_page_sections_bm25'))`,
        })
        .from(pageSections)
        .where(eq(pageSections.workspaceId, workspaceId))
        .orderBy(
          sql`${pageSections.textVector} <@> to_bm25query(to_tsvector('english', ${trimmedQuery}), 'idx_page_sections_bm25') ASC`,
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
        .where(eq(pageSections.workspaceId, workspaceId))
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

  async replacePageSections(
    tx: AppDB,
    pageId: PageId,
    sections: CreatePageSectionInput[],
  ): Promise<Result<void, DatabaseError>> {
    try {
      await tx.delete(pageSections).where(eq(pageSections.pageId, pageId));

      if (sections.length > 0) {
        await tx.insert(pageSections).values(sections);
      }

      return Result.ok(undefined);
    } catch (error) {
      console.error("SearchRepository.replacePageSections error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to save page sections" }),
      );
    }
  }

  async deletePageSections(
    tx: AppDB,
    pageId: PageId,
  ): Promise<Result<void, DatabaseError>> {
    try {
      await tx.delete(pageSections).where(eq(pageSections.pageId, pageId));
      return Result.ok(undefined);
    } catch (error) {
      console.error("SearchRepository.deletePageSections error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to delete page sections" }),
      );
    }
  }
}
