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
import type {
  PermissionCacheInvalidator,
  WorkspaceEventPublisher,
  PageEventPublisher,
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
    const txResult = await this.dbClient.transaction(async (tx) =>
      this.pagesRepository
        .createPage(tx, input)
        .then(
          Result.andThenAsync(async (page) => {
            const pagePermission =
              await this.pagesRepository.createPagePermission(tx, {
                pageId: page.id,
                userId,
                role: "editor",
                workspaceId: input.workspaceId,
              });

            if (pagePermission.isErr()) return Result.err(pagePermission.error);

            return Result.ok(page);
          }),
        )
        .then(
          Result.tapError(() => {
            tx.rollback();
          }),
        ),
    );

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

  async updatePageMetadata(
    pageId: PageId,
    data: UpdatePageMetadataInput,
  ): Promise<Result<Page, DatabaseError | NotFoundError>> {
    return this.pagesRepository.updatePageMetadata(pageId, data);
  }

  async getPagePermissions(
    workspaceId: WorkspaceId,
    pageId: PageId,
    pagination: PaginationQuery,
  ): Promise<Result<PaginatedData<PageMemberPermission>, DatabaseError>> {
    const results = await Result.allAsync([
      this.pagesRepository.getPagePermissions(pageId),
      this.workspacesService.getMembers(workspaceId, pagination),
    ]);

    if (results.isErr()) {
      return Result.err(results.error);
    }

    const [permRows, membersPaginated] = results.value;
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
    const setPermResult = await this.dbClient.transaction(async (tx) =>
      this.pagesRepository
        .setPagePermission(tx, {
          workspaceId,
          pageId,
          userId: targetUserId,
          role,
        })
        .then(
          Result.tapError(() => {
            tx.rollback();
          }),
        ),
    );

    if (setPermResult.isErr()) return setPermResult;

    const pageResult = await this.pagesRepository.getPageById(pageId);
    const pageTitle = pageResult.isOk() ? pageResult.value.title : "a page";

    const notifResult = await this.notificationsService.createNotification({
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
    });

    if (notifResult.isErr()) {
      return Result.err(notifResult.error);
    }

    await this.cacheInvalidator?.invalidateUserPermissions(
      targetUserId,
      "page",
      pageId,
    );
    await this.workspaceEventPublisher?.broadcastPagePermissionUpdated(
      workspaceId,
      {
        pageId,
        userId: targetUserId,
        role,
      },
    );

    const userResult = await this.usersService.getUserById(targetUserId);
    if (userResult.isErr()) {
      return Result.err(userResult.error);
    }
    const user = userResult.value;

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
    const createResult = await this.dbClient.transaction(async (tx) =>
      this.pagesRepository
        .createAccessRequest(tx, {
          workspaceId,
          pageId,
          userId: requester.id,
          requestedRole,
        })
        .then(
          Result.tapError(() => {
            tx.rollback();
          }),
        ),
    );

    if (createResult.isErr()) return createResult;

    const fetchResults = await Result.allAsync([
      this.pagesRepository.getPageById(pageId),
      this.workspacesService.getWorkspaceOwnerUserId(workspaceId),
    ]);

    if (fetchResults.isErr()) {
      return Result.err(fetchResults.error);
    }

    const [page, ownerUserId] = fetchResults.value;
    const pageTitle = page.title || "a page";

    await this.notificationsService.createNotification({
      userId: ownerUserId,
      metadata: {
        type: "page_access_request",
        requestId: createResult.value.id,
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

    return Result.ok(createResult.value);
  }

  async getAccessRequestStatus(pageId: PageId, userId: UserId) {
    const result = await this.pagesRepository.getPendingAccessRequestForUser(
      pageId,
      userId,
    );
    if (result.isErr()) return Result.err(result.error);
    return Result.ok({
      hasPendingRequest: Boolean(result.value),
      request: result.value,
    });
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
    const dbResult = await this.dbClient.transaction(async (tx) => {
      const requestResult =
        await this.pagesRepository.getAccessRequestById(requestId);
      if (requestResult.isErr()) return Result.err(requestResult.error);

      const request = requestResult.value;

      const setPermResult = await this.pagesRepository.setPagePermission(tx, {
        workspaceId,
        pageId,
        userId: request.userId,
        role: request.requestedRole,
      });
      if (setPermResult.isErr()) {
        tx.rollback();
        return Result.err(setPermResult.error);
      }

      const updateReqResult =
        await this.pagesRepository.updateAccessRequestStatus(
          tx,
          requestId,
          "approved",
        );
      if (updateReqResult.isErr()) {
        tx.rollback();
        return Result.err(updateReqResult.error);
      }

      return Result.ok({
        request: updateReqResult.value,
        userId: request.userId,
        role: request.requestedRole,
      });
    });

    if (dbResult.isErr()) return dbResult;

    const { request, userId: requesterId, role: grantedRole } = dbResult.value;

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

    await this.cacheInvalidator?.invalidateUserPermissions(
      requesterId,
      "page",
      pageId,
    );
    await this.workspaceEventPublisher?.broadcastPagePermissionUpdated(
      workspaceId,
      {
        pageId,
        userId: requesterId,
        role: grantedRole,
      },
    );

    return Result.ok(request);
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
    const dbResult = await this.dbClient.transaction(async (tx) => {
      const requestResult =
        await this.pagesRepository.getAccessRequestById(requestId);
      if (requestResult.isErr()) return Result.err(requestResult.error);

      const request = requestResult.value;

      const updateReqResult =
        await this.pagesRepository.updateAccessRequestStatus(
          tx,
          requestId,
          "rejected",
        );
      if (updateReqResult.isErr()) {
        tx.rollback();
        return Result.err(updateReqResult.error);
      }

      return Result.ok({
        request: updateReqResult.value,
        userId: request.userId,
        role: request.requestedRole,
      });
    });

    if (dbResult.isErr()) return dbResult;

    const { request, userId: requesterId, role } = dbResult.value;

    const pageResult = await this.pagesRepository.getPageById(pageId);
    const pageTitle = pageResult.isOk() ? pageResult.value.title : "a page";

    await this.notificationsService.createNotification({
      userId: requesterId,
      metadata: {
        type: "page_access_request_resolved",
        requestId,
        pageId,
        workspaceId,
        pageTitle,
        resolvedByUserId: rejecter.id,
        resolvedByName: rejecter.name,
        status: "rejected",
        role,
      },
      isRead: false,
    });

    return Result.ok(request);
  }

  // --- Authorization Attribute Loaders ---

  async loadPageResourceData({
    pageId,
    userId,
  }: {
    pageId: PageId;
    userId: UserId;
  }): Promise<Result<ResourceData<"page"> | null, DatabaseError>> {
    const pageResult = await this.pagesRepository.getPageById(pageId);
    if (pageResult.isErr()) {
      return pageResult.error._tag === "NotFoundError"
        ? Result.ok(null)
        : Result.err(pageResult.error);
    }

    const page = pageResult.value;
    const results = await Result.allAsync([
      this.workspacesService.loadWorkspaceScopeData({
        workspaceId: page.workspaceId,
        userId,
      }),
      this.pagesRepository.getPagePermissionForUser(pageId, userId),
    ]);

    if (results.isErr()) return Result.err(results.error);

    const [wsScope, userPageRole] = results.value;

    return Result.ok({
      pageId,
      workspaceId: page.workspaceId,
      userWorkspaceRole: wsScope?.userRole ?? null,
      userPageRole,
    });
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
    const pageResult = await this.pagesRepository.getPageById(pageId);
    if (pageResult.isErr()) {
      return pageResult.error._tag === "NotFoundError"
        ? Result.ok(null)
        : Result.err(pageResult.error);
    }

    const page = pageResult.value;
    const results = await Result.allAsync([
      this.pagesRepository.getPagePermissionForUser(pageId, targetUserId),
      this.workspacesService.loadWorkspaceScopeData({
        workspaceId: page.workspaceId,
        userId: callerUserId,
      }),
    ]);

    if (results.isErr()) return Result.err(results.error);

    const [targetRole, callerWsScope] = results.value;

    return Result.ok({
      pageId,
      workspaceId: page.workspaceId,
      targetUserId,
      targetRole,
      userWorkspaceRole: callerWsScope?.userRole ?? null,
    });
  }

  async loadPageScopeData({
    workspaceId,
    userId,
  }: {
    workspaceId?: WorkspaceId;
    userId: UserId;
  }): Promise<Result<ScopeData<"page"> | null, DatabaseError>> {
    if (!workspaceId) return Result.ok(null);

    const wsScope = await this.workspacesService.loadWorkspaceScopeData({
      workspaceId,
      userId,
    });

    if (wsScope.isErr()) return Result.err(wsScope.error);

    return Result.ok({
      workspaceId,
      userWorkspaceRole: wsScope.value?.userRole ?? null,
    });
  }

  async loadPagePermissionScopeData({
    pageId,
    userId,
  }: {
    pageId?: PageId;
    userId: UserId;
  }): Promise<Result<ScopeData<"pagePermission"> | null, DatabaseError>> {
    if (!pageId) return Result.ok(null);

    const pageResult = await this.pagesRepository.getPageById(pageId);
    if (pageResult.isErr()) {
      return pageResult.error._tag === "NotFoundError"
        ? Result.ok(null)
        : Result.err(pageResult.error);
    }

    const page = pageResult.value;
    const wsScope = await this.workspacesService.loadWorkspaceScopeData({
      workspaceId: page.workspaceId,
      userId,
    });

    if (wsScope.isErr()) return Result.err(wsScope.error);

    return Result.ok({
      pageId,
      workspaceId: page.workspaceId,
      userWorkspaceRole: wsScope.value?.userRole ?? null,
    });
  }
}
