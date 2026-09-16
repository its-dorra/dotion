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

  async getWorkspacePages({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<PageTreeNode[], DatabaseError>> {
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

  async createPage({
    input,
  }: {
    input: CreatePageInput;
  }): Promise<Result<Page, DatabaseError>> {
    try {
      const [result] = await this.db.insert(pages).values(input).returning({
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

  async createPagePermission({
    input,
  }: {
    input: CreatePagePermissionInput;
  }): Promise<Result<true, DatabaseError>> {
    try {
      await this.db.insert(pagePermissions).values(input);
      return Result.ok(true);
    } catch (error) {
      return Result.err(
        new DatabaseError({ message: "Failed to create page permission" }),
      );
    }
  }

  async getPagePermissions({
    pageId,
  }: {
    pageId: PageId;
  }): Promise<Result<PagePermissionRow[], DatabaseError>> {
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

  async setPagePermission({
    workspaceId,
    pageId,
    userId,
    role,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
    userId: UserId;
    role: AllPageRole;
  }): Promise<Result<true, DatabaseError>> {
    return this.setPagePermissionTx({
      tx: this.db,
      workspaceId,
      pageId,
      userId,
      role,
    });
  }

  async setPagePermissionTx({
    tx,
    workspaceId,
    pageId,
    userId,
    role,
  }: {
    tx: AppDB;
    workspaceId: WorkspaceId;
    pageId: PageId;
    userId: UserId;
    role: AllPageRole;
  }): Promise<Result<true, DatabaseError>> {
    try {
      if (role === "viewer") {
        await tx
          .delete(pagePermissions)
          .where(
            and(
              eq(pagePermissions.pageId, pageId),
              eq(pagePermissions.userId, userId),
              eq(pagePermissions.workspaceId, workspaceId),
            ),
          );
      } else {
        await tx
          .insert(pagePermissions)
          .values({
            pageId,
            userId,
            workspaceId,
            role,
          })
          .onConflictDoUpdate({
            target: [
              pagePermissions.pageId,
              pagePermissions.userId,
              pagePermissions.workspaceId,
            ],
            set: {
              role,
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

  async getPageContent({
    pageId,
  }: {
    pageId: PageId;
  }): Promise<Result<Uint8Array | null, DatabaseError>> {
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

  async updatePageContent({
    pageId,
    content,
  }: {
    pageId: PageId;
    content: Uint8Array;
  }): Promise<Result<true, DatabaseError>> {
    return this.updatePageContentTx({ tx: this.db, pageId, content });
  }

  async updatePageContentTx({
    tx,
    pageId,
    content,
  }: {
    tx: AppDB;
    pageId: PageId;
    content: Uint8Array;
  }): Promise<Result<true, DatabaseError>> {
    try {
      await tx
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

  async getPageWithoutContent({
    workspaceId,
    pageId,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
  }): Promise<Result<Omit<Page, "content">, DatabaseError | NotFoundError>> {
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

  async updatePageMetadata({
    pageId,
    data,
  }: {
    pageId: PageId;
    data: Partial<Pick<Page, "title" | "icon" | "cover">>;
  }): Promise<Result<Page, DatabaseError | NotFoundError>> {
    return this.updatePageMetadataTx({ tx: this.db, pageId, data });
  }

  async updatePageMetadataTx({
    tx,
    pageId,
    data,
  }: {
    tx: AppDB;
    pageId: PageId;
    data: Partial<Pick<Page, "title" | "icon" | "cover">>;
  }): Promise<Result<Page, DatabaseError | NotFoundError>> {
    try {
      const [updated] = await tx
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

  async getPageById({
    pageId,
  }: {
    pageId: PageId;
  }): Promise<Result<Page, DatabaseError | NotFoundError>> {
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

  async getPagesByIds({
    pageIds,
  }: {
    pageIds: PageId[];
  }): Promise<Result<Page[], DatabaseError>> {
    if (pageIds.length === 0) return Result.ok([]);
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
        .where(inArray(pages.id, pageIds));

      return Result.ok(rows as Page[]);
    } catch (error) {
      console.error("PagesRepository.getPagesByIds error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to fetch pages" }),
      );
    }
  }

  async getPagePermissionForUser({
    pageId,
    userId,
  }: {
    pageId: PageId;
    userId: UserId;
  }): Promise<Result<PagePermissionRole | null, DatabaseError>> {
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

  async createAccessRequest({
    pageId,
    workspaceId,
    userId,
    requestedRole,
  }: {
    pageId: PageId;
    workspaceId: WorkspaceId;
    userId: UserId;
    requestedRole: PagePermissionRole;
  }): Promise<Result<PageAccessRequest, DatabaseError>> {
    try {
      const [data] = await this.db
        .insert(pageAccessRequests)
        .values({
          pageId,
          workspaceId,
          userId,
          requestedRole,
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

  async getPendingAccessRequestForUser({
    pageId,
    userId,
  }: {
    pageId: PageId;
    userId: UserId;
  }): Promise<Result<PageAccessRequest | null, DatabaseError>> {
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

  async getAccessRequestById({
    requestId,
  }: {
    requestId: string;
  }): Promise<Result<PageAccessRequest, DatabaseError | NotFoundError>> {
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

  async updateAccessRequestStatus({
    requestId,
    status,
  }: {
    requestId: string;
    status: "approved" | "rejected";
  }): Promise<Result<PageAccessRequest, DatabaseError | NotFoundError>> {
    return this.updateAccessRequestStatusTx({ tx: this.db, requestId, status });
  }

  async updateAccessRequestStatusTx({
    tx,
    requestId,
    status,
  }: {
    tx: AppDB;
    requestId: string;
    status: "approved" | "rejected";
  }): Promise<Result<PageAccessRequest, DatabaseError | NotFoundError>> {
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

  async getTrashedPages({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<Page[], DatabaseError>> {
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

  async getDescendantPageIds({
    workspaceId,
    pageId,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
  }): Promise<Result<PageId[], DatabaseError>> {
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

  async moveToTrash({
    pageIds,
  }: {
    pageIds: PageId[];
  }): Promise<Result<true, DatabaseError>> {
    try {
      if (pageIds.length === 0) {
        return Result.ok(true);
      }

      await this.db
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

  async restoreFromTrash({
    pageId,
    parentId,
    descendantIds,
  }: {
    pageId: PageId;
    parentId: PageId | null;
    descendantIds: PageId[];
  }): Promise<Result<Page, DatabaseError | NotFoundError>> {
    try {
      const [updated] = await this.db
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
        await this.db
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

  async deletePermanently({
    pageIds,
  }: {
    pageIds: PageId[];
  }): Promise<Result<true, DatabaseError>> {
    try {
      if (pageIds.length === 0) {
        return Result.ok(true);
      }

      await this.db.delete(pages).where(inArray(pages.id, pageIds));

      return Result.ok(true);
    } catch (error) {
      console.error("PagesRepository.deletePermanently error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to permanently delete page" }),
      );
    }
  }

  async emptyTrash({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<PageId[], DatabaseError>> {
    try {
      const trashedPages = await this.db
        .select({ id: pages.id })
        .from(pages)
        .where(
          and(eq(pages.workspaceId, workspaceId), eq(pages.inTrash, true)),
        );

      if (trashedPages.length === 0) {
        return Result.ok([]);
      }

      const pageIds = trashedPages.map((p) => p.id as PageId);
      await this.db.delete(pages).where(inArray(pages.id, pageIds));

      return Result.ok(pageIds);
    } catch (error) {
      console.error("PagesRepository.emptyTrash error:", error);
      return Result.err(
        new DatabaseError({ message: "Failed to empty trash" }),
      );
    }
  }
}
