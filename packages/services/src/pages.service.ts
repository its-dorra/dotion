import type {
  AllPageRole,
  CreatePageInput,
  Page,
  PageId,
  PageMemberPermission,
  PagePermissionRole,
  PageTreeNode,
  UpdatePageMetadataInput,
} from "@dotion/shared/pages/types";
import type {
  PaginationQuery,
  PaginatedData,
} from "@dotion/shared/pagination/types";
import type { DBClient } from "@dotion/db";
import { DatabaseError, NotFoundError } from "@dotion/db";
import type { PagesRepository } from "@dotion/db/repositories";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserId } from "@dotion/shared/users/types";
import { Result } from "better-result";
import type { NotificationsService } from "./notifications.service";
import type { WorkspacesService } from "./workspaces.service";
import type { UsersService } from "./users.service";
import type { OutboxService } from "./outbox.service";
import type {
  PermissionCacheInvalidator,
  WorkspaceEventPublisher,
  PageEventPublisher,
  PageCleanupQueue,
} from "./realtime.types";
import type {
  ResourceData,
  ScopeData,
} from "@dotion/shared/authorization/types";

export class PagesService {
  constructor(
    private readonly pagesRepository: PagesRepository,
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly dbClient: DBClient,
    private readonly cacheInvalidator?: PermissionCacheInvalidator,
    private readonly workspaceEventPublisher?: WorkspaceEventPublisher,
    _pageEventPublisher?: PageEventPublisher,
    private readonly pageCleanupQueue?: PageCleanupQueue,
    private readonly outboxService?: OutboxService,
  ) {}

  async getPagesTree(
    workspaceId: WorkspaceId,
    _userId?: UserId,
  ): Promise<Result<PageTreeNode[], DatabaseError>> {
    return this.pagesRepository.getWorkspacePages(workspaceId);
  }

  async createPage(
    { userId }: { userId: UserId },
    input: CreatePageInput,
  ): Promise<Result<Page, DatabaseError>> {
    const txResult = await this.dbClient.transaction(async (tx) => {
      return Result.gen(async function* (this: PagesService) {
        const page = yield* Result.await(
          this.pagesRepository.createPage(tx, input),
        );
        yield* Result.await(
          this.pagesRepository.createPagePermission(tx, {
            pageId: page.id,
            userId,
            role: "editor",
            workspaceId: input.workspaceId,
          }),
        );
        return Result.ok(page);
      }, this).then(
        Result.tapError(() => {
          tx.rollback();
        }),
      );
    });

    if (txResult.isOk()) {
      await this.workspaceEventPublisher?.broadcastPageCreated(
        input.workspaceId,
        txResult.value,
      );
    }

    return txResult;
  }

  async getPageById(
    pageId: PageId,
  ): Promise<Result<Page, DatabaseError | NotFoundError>> {
    return this.pagesRepository.getPageById(pageId);
  }

  async getPagesByIds(
    pageIds: PageId[],
  ): Promise<Result<Page[], DatabaseError>> {
    return this.pagesRepository.getPagesByIds(pageIds);
  }

  async getPageWithoutContent(
    workspaceId: WorkspaceId,
    pageId: PageId,
    _userId?: UserId,
  ): Promise<Result<Omit<Page, "content">, DatabaseError | NotFoundError>> {
    return this.pagesRepository.getPageWithoutContent(workspaceId, pageId);
  }

  async getPageContent(
    pageId: PageId,
  ): Promise<Result<Uint8Array | null, DatabaseError>> {
    return this.pagesRepository.getPageContent(pageId);
  }

  async updatePageContent(
    pageId: PageId,
    content: Uint8Array,
  ): Promise<Result<true, DatabaseError>> {
    return this.pagesRepository.updatePageContent(pageId, content);
  }

  async updatePageContentWithOutbox(
    pageId: PageId,
    content: Uint8Array,
    workspaceId: WorkspaceId,
    version?: number,
  ): Promise<Result<true, DatabaseError>> {
    return this.dbClient.transaction(async (tx) => {
      return Result.gen(async function* (this: PagesService) {
        yield* Result.await(
          this.pagesRepository.updatePageContentTx(tx, pageId, content),
        );
        if (this.outboxService) {
          yield* Result.await(
            this.outboxService.upsertEntryTx(tx, {
              type: "page_indexing",
              aggregateId: pageId,
              payload: {
                workspaceId,
                pageId,
                version,
              },
            }),
          );
        }
        return Result.ok(true as const);
      }, this).then(
        Result.tapError(() => {
          tx.rollback();
        }),
      );
    });
  }

  async updatePageMetadata(
    pageId: PageId,
    data: UpdatePageMetadataInput,
  ): Promise<Result<Page, DatabaseError | NotFoundError>> {
    return this.pagesRepository.updatePageMetadata(pageId, data);
  }

  async updatePageMetadataWithOutbox(
    pageId: PageId,
    data: UpdatePageMetadataInput,
    workspaceId: WorkspaceId,
  ): Promise<Result<Page, DatabaseError | NotFoundError>> {
    return this.dbClient.transaction(async (tx) => {
      return Result.gen(async function* (this: PagesService) {
        const page = yield* Result.await(
          this.pagesRepository.updatePageMetadataTx(tx, pageId, data),
        );
        if (data.title !== undefined && this.outboxService) {
          yield* Result.await(
            this.outboxService.upsertEntryTx(tx, {
              type: "page_indexing",
              aggregateId: pageId,
              payload: {
                workspaceId,
                pageId,
              },
            }),
          );
        }
        return Result.ok(page);
      }, this).then(
        Result.tapError(() => {
          tx.rollback();
        }),
      );
    });
  }

  async getPagePermissions(
    workspaceId: WorkspaceId,
    pageId: PageId,
    pagination: PaginationQuery,
  ): Promise<Result<PaginatedData<PageMemberPermission>, DatabaseError>> {
    return Result.gen(async function* (this: PagesService) {
      const [permRows, membersPaginated] = yield* Result.await(
        Result.allAsync([
          this.pagesRepository.getPagePermissions(pageId),
          this.workspacesService.getMembers(workspaceId, pagination),
        ]),
      );

      const permMap = new Map(permRows.map((p) => [p.userId, p.role]));

      const payload: PageMemberPermission[] = membersPaginated.payload.map(
        (member) => ({
          id: `${workspaceId}_${member.userId}`,
          userId: member.userId,
          name: member.name,
          email: member.email,
          avatarUrl: member.avatarUrl,
          role: permMap.get(member.userId) ?? "viewer",
          joinedAt: member.joinedAt,
        }),
      );

      return Result.ok({
        pagination: membersPaginated.pagination,
        payload,
      });
    }, this);
  }

  async updatePagePermission({
    workspaceId,
    pageId,
    targetUserId,
    role,
    changedBy,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
    targetUserId: UserId;
    role: AllPageRole;
    changedBy: { id: UserId; name: string };
  }): Promise<Result<PageMemberPermission, DatabaseError | NotFoundError>> {
    return Result.gen(async function* (this: PagesService) {
      yield* Result.await(
        this.pagesRepository.setPagePermission(this.dbClient, {
          workspaceId,
          pageId,
          userId: targetUserId,
          role,
        }),
      );

      const [page, user] = yield* Result.await(
        Result.allAsync([
          this.pagesRepository.getPageById(pageId),
          this.usersService.getUserById(targetUserId),
        ]),
      );

      const pageTitle = page.title || "a page";

      yield* Result.await(
        this.notificationsService.createNotification({
          userId: targetUserId,
          metadata: {
            type: "permission_change",
            pageId,
            workspaceId,
            pageTitle,
            changedByUserId: changedBy.id,
            changedByName: changedBy.name,
            newRole: role as any,
          },
          isRead: false,
        }),
      );

      await Promise.all([
        this.cacheInvalidator?.invalidateUserPermissions(
          targetUserId,
          "page",
          pageId,
        ),
        this.workspaceEventPublisher?.broadcastPagePermissionUpdated(
          workspaceId,
          {
            pageId,
            userId: targetUserId,
            role,
          },
        ),
      ]);

      const pageMemberPermission: PageMemberPermission = {
        id: `${workspaceId}_${targetUserId}`,
        userId: targetUserId,
        name: user.name ?? "Member",
        email: user.email,
        avatarUrl: user.image ?? null,
        role,
        joinedAt: new Date(),
      };

      return Result.ok(pageMemberPermission);
    }, this);
  }

  async createAccessRequest({
    workspaceId,
    pageId,
    requester,
    requestedRole,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
    requester: { id: UserId; name: string; email: string };
    requestedRole: PagePermissionRole;
  }) {
    return Result.gen(async function* (this: PagesService) {
      const createdRequest = yield* Result.await(
        this.pagesRepository.createAccessRequest(this.dbClient, {
          workspaceId,
          pageId,
          userId: requester.id,
          requestedRole,
        }),
      );

      const [page, ownerUserId] = yield* Result.await(
        Result.allAsync([
          this.pagesRepository.getPageById(pageId),
          this.workspacesService.getWorkspaceOwnerUserId(workspaceId),
        ]),
      );

      const pageTitle = page.title || "a page";

      await this.notificationsService.createNotification({
        userId: ownerUserId,
        metadata: {
          type: "page_access_request",
          requestId: createdRequest.id,
          pageId,
          workspaceId,
          pageTitle,
          requestedRole,
          requestedByUserId: requester.id,
          requestedByName: requester.name,
          requestedByEmail: requester.email,
        },
        isRead: false,
      });

      return Result.ok(createdRequest);
    }, this);
  }

  async getAccessRequestStatus(pageId: PageId, userId: UserId) {
    return this.pagesRepository
      .getPendingAccessRequestForUser(pageId, userId)
      .then(
        Result.map((request) => ({
          hasPendingRequest: Boolean(request),
          request,
        })),
      );
  }

  async approveAccessRequest({
    workspaceId,
    pageId,
    requestId,
    approver,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
    requestId: string;
    approver: { id: UserId; name: string };
  }) {
    return Result.gen(async function* (this: PagesService) {
      const dbResult = yield* Result.await(
        this.dbClient.transaction(async (tx) => {
          return Result.gen(async function* (this: PagesService) {
            const request = yield* Result.await(
              this.pagesRepository.getAccessRequestById(requestId),
            );

            yield* Result.await(
              this.pagesRepository.setPagePermission(tx, {
                workspaceId,
                pageId,
                userId: request.userId,
                role: request.requestedRole,
              }),
            );

            const updateReqResult = yield* Result.await(
              this.pagesRepository.updateAccessRequestStatus(
                tx,
                requestId,
                "approved",
              ),
            );

            return Result.ok({
              request: updateReqResult,
              userId: request.userId,
              role: request.requestedRole,
            });
          }, this).then(
            Result.tapError(() => {
              tx.rollback();
            }),
          );
        }),
      );

      const { request, userId: requesterId, role: grantedRole } = dbResult;

      const pageResult = await this.pagesRepository.getPageById(pageId);
      const pageTitle = pageResult.isOk() ? pageResult.value.title : "a page";

      await this.notificationsService.createNotification({
        userId: requesterId,
        metadata: {
          type: "permission_change",
          pageId,
          workspaceId,
          pageTitle,
          changedByUserId: approver.id,
          changedByName: approver.name,
          newRole: grantedRole,
        },
        isRead: false,
      });

      await Promise.all([
        this.cacheInvalidator?.invalidateUserPermissions(
          requesterId,
          "page",
          pageId,
        ),
        this.workspaceEventPublisher?.broadcastPagePermissionUpdated(
          workspaceId,
          {
            pageId,
            userId: requesterId,
            role: grantedRole,
          },
        ),
      ]);

      return Result.ok(request);
    }, this);
  }

  async rejectAccessRequest({
    workspaceId,
    pageId,
    requestId,
    rejecter,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
    requestId: string;
    rejecter: { id: UserId; name: string };
  }) {
    return Result.gen(async function* (this: PagesService) {
      const request = yield* Result.await(
        this.pagesRepository.getAccessRequestById(requestId),
      );

      const updatedRequest = yield* Result.await(
        this.pagesRepository.updateAccessRequestStatus(
          this.dbClient,
          requestId,
          "rejected",
        ),
      );

      const pageResult = await this.pagesRepository.getPageById(pageId);
      const pageTitle = pageResult.isOk() ? pageResult.value.title : "a page";

      await this.notificationsService.createNotification({
        userId: request.userId,
        metadata: {
          type: "page_access_request_resolved",
          requestId,
          pageId,
          workspaceId,
          pageTitle,
          resolvedByUserId: rejecter.id,
          resolvedByName: rejecter.name,
          status: "rejected",
          role: request.requestedRole,
        },
        isRead: false,
      });

      return Result.ok(updatedRequest);
    }, this);
  }

  // --- Authorization Attribute Loaders ---

  async loadPageResourceData({
    pageId,
    userId,
  }: {
    pageId: PageId;
    userId: UserId;
  }): Promise<Result<ResourceData<"page"> | null, DatabaseError>> {
    return Result.gen(async function* (this: PagesService) {
      const page = yield* Result.await(
        this.pagesRepository.getPageById(pageId).then((res) => {
          if (res.isOk()) return Result.ok(res.value);
          if (NotFoundError.is(res.error)) return Result.ok(null);
          return Result.err(res.error);
        }),
      );
      if (!page) return Result.ok(null);

      const [wsScope, userPageRole] = yield* Result.await(
        Result.allAsync([
          this.workspacesService.loadWorkspaceScopeData({
            workspaceId: page.workspaceId,
            userId,
          }),
          this.pagesRepository.getPagePermissionForUser(pageId, userId),
        ]),
      );

      return Result.ok({
        pageId,
        workspaceId: page.workspaceId,
        userWorkspaceRole: wsScope?.userRole ?? null,
        userPageRole,
      });
    }, this);
  }

  async loadPagePermissionResourceData({
    pageId,
    targetUserId,
    callerUserId,
  }: {
    pageId: PageId;
    targetUserId: UserId;
    callerUserId: UserId;
  }): Promise<Result<ResourceData<"pagePermission"> | null, DatabaseError>> {
    return Result.gen(async function* (this: PagesService) {
      const page = yield* Result.await(
        this.pagesRepository.getPageById(pageId).then((res) => {
          if (res.isOk()) return Result.ok(res.value);
          if (NotFoundError.is(res.error)) return Result.ok(null);
          return Result.err(res.error);
        }),
      );
      if (!page) return Result.ok(null);

      const [targetRole, callerWsScope] = yield* Result.await(
        Result.allAsync([
          this.pagesRepository.getPagePermissionForUser(pageId, targetUserId),
          this.workspacesService.loadWorkspaceScopeData({
            workspaceId: page.workspaceId,
            userId: callerUserId,
          }),
        ]),
      );

      return Result.ok({
        pageId,
        workspaceId: page.workspaceId,
        targetUserId,
        targetRole,
        userWorkspaceRole: callerWsScope?.userRole ?? null,
      });
    }, this);
  }

  async loadPageScopeData({
    workspaceId,
    userId,
  }: {
    workspaceId?: WorkspaceId;
    userId: UserId;
  }): Promise<Result<ScopeData<"page"> | null, DatabaseError>> {
    if (!workspaceId) return Result.ok(null);

    return this.workspacesService
      .loadWorkspaceScopeData({ workspaceId, userId })
      .then(
        Result.map((wsScope) => ({
          workspaceId,
          userWorkspaceRole: wsScope?.userRole ?? null,
        })),
      );
  }

  async loadPagePermissionScopeData({
    pageId,
    userId,
  }: {
    pageId?: PageId;
    userId: UserId;
  }): Promise<Result<ScopeData<"pagePermission"> | null, DatabaseError>> {
    if (!pageId) return Result.ok(null);

    return Result.gen(async function* (this: PagesService) {
      const page = yield* Result.await(
        this.pagesRepository.getPageById(pageId).then((res) => {
          if (res.isOk()) return Result.ok(res.value);
          if (NotFoundError.is(res.error)) return Result.ok(null);
          return Result.err(res.error);
        }),
      );
      if (!page) return Result.ok(null);

      const wsScope = yield* Result.await(
        this.workspacesService.loadWorkspaceScopeData({
          workspaceId: page.workspaceId,
          userId,
        }),
      );

      return Result.ok({
        pageId,
        workspaceId: page.workspaceId,
        userWorkspaceRole: wsScope?.userRole ?? null,
      });
    }, this);
  }

  async getTrashedPages(
    workspaceId: WorkspaceId,
  ): Promise<Result<Page[], DatabaseError>> {
    return this.pagesRepository.getTrashedPages(workspaceId);
  }

  async moveToTrash(
    _caller: { userId: UserId },
    workspaceId: WorkspaceId,
    pageId: PageId,
  ): Promise<Result<{ success: true }, DatabaseError | NotFoundError>> {
    return Result.gen(async function* (this: PagesService) {
      const page = yield* Result.await(
        this.pagesRepository.getPageWithoutContent(workspaceId, pageId),
      );

      const descendants = yield* Result.await(
        this.pagesRepository.getDescendantPageIds(workspaceId, pageId),
      );
      const allPageIdsToTrash = [page.id, ...descendants];

      yield* Result.await(
        this.pagesRepository.moveToTrash(this.dbClient, allPageIdsToTrash),
      );

      await this.workspaceEventPublisher?.broadcastPageMovedToTrash(
        workspaceId,
        pageId,
      );

      return Result.ok({ success: true as const });
    }, this);
  }

  async restoreFromTrash(
    _caller: { userId: UserId },
    workspaceId: WorkspaceId,
    pageId: PageId,
  ): Promise<Result<Page, DatabaseError | NotFoundError>> {
    return Result.gen(async function* (this: PagesService) {
      const [page, descendants] = yield* Result.await(
        Result.allAsync([
          this.pagesRepository.getPageWithoutContent(workspaceId, pageId),
          this.pagesRepository.getDescendantPageIds(workspaceId, pageId),
        ]),
      );

      let targetParentId = page.parentId;
      if (targetParentId) {
        const parentRes = await this.pagesRepository.getPageWithoutContent(
          workspaceId,
          targetParentId,
        );
        if (parentRes.isErr() || parentRes.value.inTrash) {
          targetParentId = null;
        }
      }

      const restored = yield* Result.await(
        this.pagesRepository.restoreFromTrash(
          this.dbClient,
          pageId,
          targetParentId,
          descendants,
        ),
      );

      await this.workspaceEventPublisher?.broadcastPageRestored(
        workspaceId,
        restored,
      );

      return Result.ok(restored);
    }, this);
  }

  async deletePermanently(
    workspaceId: WorkspaceId,
    pageId: PageId,
  ): Promise<Result<{ success: true }, DatabaseError | NotFoundError>> {
    return Result.gen(async function* (this: PagesService) {
      const descendants = yield* Result.await(
        this.pagesRepository.getDescendantPageIds(workspaceId, pageId),
      );
      const allPageIdsToDelete = [pageId, ...descendants];

      yield* Result.await(
        this.pagesRepository.deletePermanently(
          this.dbClient,
          allPageIdsToDelete,
        ),
      );

      await Promise.all([
        this.workspaceEventPublisher?.broadcastPageDeletedPermanently(
          workspaceId,
          pageId,
        ),
        ...allPageIdsToDelete.map((pid) =>
          this.pageCleanupQueue?.enqueuePageAssetCleanup({
            workspaceId,
            pageId: pid,
          }),
        ),
      ]);

      return Result.ok({ success: true as const });
    }, this);
  }
}
