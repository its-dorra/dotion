import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { AppDB, DBClient } from "..";
import { DatabaseError, NotFoundError } from "../errors";
import type { UserId } from "@dotion/shared/users/types";
import { pageAccessRequests, pagePermissions, pages } from "../schema";

import type {
  AllPageRole,
  CreatePageInput,
  CreatePagePermissionInput,
  Page,
  PageId,
  PagePermissionRole,
  PageTreeNode,
  PageAccessRequest,
} from "@dotion/shared/pages/types";
import { Result } from "better-result";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export interface PagePermissionRow {
  pageId: PageId;
  userId: UserId;
  workspaceId: WorkspaceId;
  role: PagePermissionRole;
  createdAt: Date;
  updatedAt: Date;
}

export class PagesRepository {
  constructor(private readonly db: DBClient) {}

  async getWorkspacePages(
    workspaceId: WorkspaceId,
  ): Promise<Result<PageTreeNode[], DatabaseError>> {
    try {
      const result = await this.db
        .select({
          id: pages.id,
          parentId: pages.parentId,
          title: pages.title,
          icon: pages.icon,
        })
        .from(pages)
        .where(
          and(eq(pages.workspaceId, workspaceId), eq(pages.inTrash, false)),
        );

      return Result.ok(result);
    } catch (error) {
      console.error("Error fetching pages tree:", error);
      return Result.err(
        new DatabaseError({
          message: "Failed to get all pages",
        }),
      );
    }
  }

  async createPage(
    tx: AppDB,
    input: CreatePageInput,
  ): Promise<Result<Page, DatabaseError>> {
    try {
      const [result] = await tx.insert(pages).values(input).returning({
        id: pages.id,
        parentId: pages.parentId,
        workspaceId: pages.workspaceId,
        title: pages.title,
        icon: pages.icon,
        cover: pages.cover,
        inTrash: pages.inTrash,
        createdAt: pages.createdAt,
        updatedAt: pages.updatedAt,
      });
      if (!result) {
        return Result.err(
          new DatabaseError({
            message: "Failed to create page",
          }),
        );
      }
      return Result.ok(result);
    } catch (error) {
      console.error("Error creating page:", error);

      return Result.err(
        new DatabaseError({
          message: "Failed to create page",
        }),
      );
    }
  }

  async createPagePermission(
    tx: AppDB,
    input: CreatePagePermissionInput,
  ): Promise<Result<true, DatabaseError>> {
    try {
      await tx.insert(pagePermissions).values(input);

      return Result.ok(true);
    } catch (error) {
      return Result.err(
        new DatabaseError({ message: "Failed to create page permission" }),
      );
    }
  }

  async getPagePermissions(
    pageId: PageId,
  ): Promise<Result<PagePermissionRow[], DatabaseError>> {
    try {
      const rows = await this.db
        .select({
          pageId: pagePermissions.pageId,
          userId: pagePermissions.userId,
          workspaceId: pagePermissions.workspaceId,
          role: pagePermissions.role,
          createdAt: pagePermissions.createdAt,
          updatedAt: pagePermissions.updatedAt,
        })
        .from(pagePermissions)
        .where(eq(pagePermissions.pageId, pageId));

      return Result.ok(rows as PagePermissionRow[]);
    } catch (error) {
      console.error("PagesRepository.getPagePermissions error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to get page permissions" }),
      );
    }
  }

  async setPagePermission(
    tx: AppDB,
    input: {
      workspaceId: WorkspaceId;
      pageId: PageId;
      userId: UserId;
      role: AllPageRole;
    },
  ): Promise<Result<true, DatabaseError>> {
    try {
      if (input.role === "viewer") {
        await tx
          .delete(pagePermissions)
          .where(
            and(
              eq(pagePermissions.pageId, input.pageId),
              eq(pagePermissions.userId, input.userId),
              eq(pagePermissions.workspaceId, input.workspaceId),
            ),
          );
      } else {
        await tx
          .insert(pagePermissions)
          .values({
            pageId: input.pageId,
            userId: input.userId,
            workspaceId: input.workspaceId,
            role: input.role,
          })
          .onConflictDoUpdate({
            target: [
              pagePermissions.pageId,
              pagePermissions.userId,
              pagePermissions.workspaceId,
            ],
            set: {
              role: input.role,
              updatedAt: new Date(),
            },
          });
      }

      return Result.ok(true);
    } catch (error) {
      console.error("PagesRepository.setPagePermission error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to update page permission" }),
      );
    }
  }

  async getPageContent(
    pageId: PageId,
  ): Promise<Result<Uint8Array | null, DatabaseError>> {
    try {
      const [pageData] = await this.db
        .select({ content: pages.content })
        .from(pages)
        .where(eq(pages.id, pageId));

      if (!pageData || !pageData.content) {
        return Result.ok(null);
      }
      return Result.ok(new Uint8Array(pageData.content));
    } catch (error) {
      console.error("PagesRepository.getPageContent error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to fetch page content" }),
      );
    }
  }

  async updatePageContent(
    pageId: PageId,
    content: Uint8Array,
  ): Promise<Result<true, DatabaseError>> {
    try {
      await this.db
        .update(pages)
        .set({ content: Buffer.from(content) })
        .where(eq(pages.id, pageId));
      return Result.ok(true);
    } catch (error) {
      console.error("PagesRepository.updatePageContent error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to update page content" }),
      );
    }
  }

  async getPageWithoutContent(
    workspaceId: WorkspaceId,
    pageId: PageId,
  ): Promise<Result<Omit<Page, "content">, DatabaseError | NotFoundError>> {
    try {
      const [page] = await this.db
        .select({
          id: pages.id,
          parentId: pages.parentId,
          workspaceId: pages.workspaceId,
          title: pages.title,
          icon: pages.icon,
          cover: pages.cover,
          inTrash: pages.inTrash,
          createdAt: pages.createdAt,
          updatedAt: pages.updatedAt,
        })
        .from(pages)
        .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)));

      if (!page) {
        return Result.err(new NotFoundError({ message: "Page not found " }));
      }

      return Result.ok(page);
    } catch (error) {
      console.error("PagesRepository.getPageWithoutContent error:", error);
      return Result.err(new DatabaseError({ message: "Failed to fetch page" }));
    }
  }

  async updatePageMetadata(
    pageId: PageId,
    data: Partial<Pick<Page, "title" | "icon" | "cover">>,
  ): Promise<Result<Page, DatabaseError | NotFoundError>> {
    try {
      const [updated] = await this.db
        .update(pages)
        .set(data)
        .where(eq(pages.id, pageId))
        .returning({
          id: pages.id,
          parentId: pages.parentId,
          workspaceId: pages.workspaceId,
          title: pages.title,
          icon: pages.icon,
          cover: pages.cover,
          inTrash: pages.inTrash,
          createdAt: pages.createdAt,
          updatedAt: pages.updatedAt,
        });

      if (!updated) {
        return Result.err(new NotFoundError({ message: "Page not found" }));
      }

      return Result.ok(updated);
    } catch (error) {
      console.error("PagesRepository.updatePageMetadata error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to update page metadata" }),
      );
    }
  }

  async getPageById(
    pageId: PageId,
  ): Promise<Result<Page, DatabaseError | NotFoundError>> {
    try {
      const [page] = await this.db
        .select({
          id: pages.id,
          parentId: pages.parentId,
          workspaceId: pages.workspaceId,
          title: pages.title,
          icon: pages.icon,
          cover: pages.cover,
          inTrash: pages.inTrash,
          createdAt: pages.createdAt,
          updatedAt: pages.updatedAt,
        })
        .from(pages)
        .where(eq(pages.id, pageId));

      if (!page) {
        return Result.err(new NotFoundError({ message: "Page not found" }));
      }

      return Result.ok(page);
    } catch (error) {
      console.error("PagesRepository.getPageById error:", error);
      return Result.err(new DatabaseError({ message: "Failed to fetch page" }));
    }
  }

  async getPagePermissionForUser(
    pageId: PageId,
    userId: UserId,
  ): Promise<Result<PagePermissionRole | null, DatabaseError>> {
    try {
      const [permission] = await this.db
        .select({ role: pagePermissions.role })
        .from(pagePermissions)
        .where(
          and(
            eq(pagePermissions.pageId, pageId),
            eq(pagePermissions.userId, userId),
          ),
        );

      return Result.ok((permission?.role as PagePermissionRole) ?? null);
    } catch (error) {
      console.error("PagesRepository.getPagePermissionForUser error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to fetch page permission" }),
      );
    }
  }

  async createAccessRequest(
    tx: AppDB,
    input: {
      pageId: PageId;
      workspaceId: WorkspaceId;
      userId: UserId;
      requestedRole: PagePermissionRole;
    },
  ): Promise<Result<PageAccessRequest, DatabaseError>> {
    try {
      const [data] = await tx
        .insert(pageAccessRequests)
        .values({
          pageId: input.pageId,
          workspaceId: input.workspaceId,
          userId: input.userId,
          requestedRole: input.requestedRole,
          status: "pending",
        })
        .returning();

      if (!data) {
        return Result.err(
          new DatabaseError({ message: "Failed to create access request" }),
        );
      }

      return Result.ok(data as PageAccessRequest);
    } catch (error) {
      console.error("PagesRepository.createAccessRequest error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to create access request" }),
      );
    }
  }

  async getPendingAccessRequestForUser(
    pageId: PageId,
    userId: UserId,
  ): Promise<Result<PageAccessRequest | null, DatabaseError>> {
    try {
      const [request] = await this.db
        .select()
        .from(pageAccessRequests)
        .where(
          and(
            eq(pageAccessRequests.pageId, pageId),
            eq(pageAccessRequests.userId, userId),
            eq(pageAccessRequests.status, "pending"),
          ),
        )
        .orderBy(desc(pageAccessRequests.createdAt));

      return Result.ok((request as PageAccessRequest) ?? null);
    } catch (error) {
      console.error(
        "PagesRepository.getPendingAccessRequestForUser error:",
        error,
      );
      return Result.err(
        new DatabaseError({ message: "Failed to fetch access request" }),
      );
    }
  }

  async getAccessRequestById(
    requestId: string,
  ): Promise<Result<PageAccessRequest, DatabaseError | NotFoundError>> {
    try {
      const [request] = await this.db
        .select()
        .from(pageAccessRequests)
        .where(eq(pageAccessRequests.id, requestId));

      if (!request) {
        return Result.err(
          new NotFoundError({ message: "Access request not found" }),
        );
      }

      return Result.ok(request as PageAccessRequest);
    } catch (error) {
      console.error("PagesRepository.getAccessRequestById error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to fetch access request" }),
      );
    }
  }

  async updateAccessRequestStatus(
    tx: AppDB,
    requestId: string,
    status: "approved" | "rejected",
  ): Promise<Result<PageAccessRequest, DatabaseError | NotFoundError>> {
    try {
      const [updated] = await tx
        .update(pageAccessRequests)
        .set({ status })
        .where(eq(pageAccessRequests.id, requestId))
        .returning();

      if (!updated) {
        return Result.err(
          new NotFoundError({ message: "Access request not found" }),
        );
      }

      return Result.ok(updated as PageAccessRequest);
    } catch (error) {
      console.error("PagesRepository.updateAccessRequestStatus error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to update access request" }),
      );
    }
  }

  async getTrashedPages(
    workspaceId: WorkspaceId,
  ): Promise<Result<Page[], DatabaseError>> {
    try {
      const rows = await this.db
        .select({
          id: pages.id,
          parentId: pages.parentId,
          workspaceId: pages.workspaceId,
          title: pages.title,
          icon: pages.icon,
          cover: pages.cover,
          inTrash: pages.inTrash,
          createdAt: pages.createdAt,
          updatedAt: pages.updatedAt,
        })
        .from(pages)
        .where(and(eq(pages.workspaceId, workspaceId), eq(pages.inTrash, true)))
        .orderBy(desc(pages.updatedAt));

      return Result.ok(rows);
    } catch (error) {
      console.error("PagesRepository.getTrashedPages error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to fetch trashed pages" }),
      );
    }
  }

  async getDescendantPageIds(
    workspaceId: WorkspaceId,
    pageId: PageId,
  ): Promise<Result<PageId[], DatabaseError>> {
    try {
      const query = sql<{ id: PageId }>`
      WITH RECURSIVE page_tree AS (
        SELECT ${pages.id} AS id
        FROM ${pages}
        WHERE ${pages.parentId} = ${pageId}
          AND ${pages.workspaceId} = ${workspaceId}

        UNION ALL

        SELECT ${pages.id} AS id
        FROM ${pages}
        INNER JOIN page_tree
          ON ${pages.parentId} = page_tree.id
        WHERE ${pages.workspaceId} = ${workspaceId}
      )
      SELECT id
      FROM page_tree
    `;

      const result = await this.db.execute(query);

      return Result.ok(result.rows.map((row) => row.id) as PageId[]);
    } catch (error) {
      console.error("PagesRepository.getDescendantPageIds error:", error);

      return Result.err(
        new DatabaseError({
          message: "Failed to get descendant page IDs",
        }),
      );
    }
  }

  async moveToTrash(
    tx: AppDB,
    pageIds: PageId[],
  ): Promise<Result<true, DatabaseError>> {
    try {
      if (pageIds.length === 0) {
        return Result.ok(true);
      }

      await tx
        .update(pages)
        .set({ inTrash: true, updatedAt: new Date() })
        .where(inArray(pages.id, pageIds));

      return Result.ok(true);
    } catch (error) {
      console.error("PagesRepository.moveToTrash error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to move pages to trash" }),
      );
    }
  }

  async restoreFromTrash(
    tx: AppDB,
    pageId: PageId,
    parentId: PageId | null,
    descendantIds: PageId[] = [],
  ): Promise<Result<Page, DatabaseError | NotFoundError>> {
    try {
      const [updated] = await tx
        .update(pages)
        .set({ inTrash: false, parentId, updatedAt: new Date() })
        .where(eq(pages.id, pageId))
        .returning({
          id: pages.id,
          parentId: pages.parentId,
          workspaceId: pages.workspaceId,
          title: pages.title,
          icon: pages.icon,
          cover: pages.cover,
          inTrash: pages.inTrash,
          createdAt: pages.createdAt,
          updatedAt: pages.updatedAt,
        });

      if (!updated) {
        return Result.err(new NotFoundError({ message: "Page not found" }));
      }

      if (descendantIds.length > 0) {
        await tx
          .update(pages)
          .set({ inTrash: false, updatedAt: new Date() })
          .where(inArray(pages.id, descendantIds));
      }

      return Result.ok(updated);
    } catch (error) {
      console.error("PagesRepository.restoreFromTrash error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to restore page from trash" }),
      );
    }
  }

  async deletePermanently(
    tx: AppDB,
    pageIds: PageId[],
  ): Promise<Result<true, DatabaseError>> {
    try {
      if (pageIds.length === 0) {
        return Result.ok(true);
      }

      await tx.delete(pages).where(inArray(pages.id, pageIds));

      return Result.ok(true);
    } catch (error) {
      console.error("PagesRepository.deletePermanently error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to permanently delete page" }),
      );
    }
  }
}
