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
import type { PageTreeItem } from "@dotion/shared/assistant/tools";
import { Result } from "better-result";
import type { UsersService } from "./users.service";
import type { WorkspacesService } from "./workspaces.service";
import type { OutboxService } from "./outbox.service";
import type { DomainEventDispatcher } from "./event-dispatcher.types";
import type {
  ResourceData,
  ScopeData,
} from "@dotion/shared/authorization/types";

export class PagesService {
  constructor(
    private readonly pagesRepository: PagesRepository,
    private readonly workspacesService: WorkspacesService,
    private readonly usersService: UsersService,
    private readonly dbClient: DBClient,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly outboxService: OutboxService,
  ) {}

  async getPagesTree({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<PageTreeNode[], DatabaseError>> {
    return this.pagesRepository.getWorkspacePages({ workspaceId });
  }

  async getPageTreeHierarchy({
    workspaceId,
    rootPageId,
    maxDepth = 3,
  }: {
    workspaceId: WorkspaceId;
    rootPageId?: PageId;
    maxDepth?: number;
  }): Promise<Result<PageTreeItem[], DatabaseError>> {
    const pagesResult = await this.pagesRepository.getWorkspacePages({
      workspaceId,
    });
    if (pagesResult.isErr()) return pagesResult;

    const allPages = pagesResult.value;
    const pageMap = new Map<string, PageTreeNode>();
    for (const page of allPages) {
      pageMap.set(page.id, page);
    }

    const childrenMap = new Map<string | null, PageTreeNode[]>();
    for (const page of allPages) {
      const pId =
        page.parentId && pageMap.has(page.parentId) ? page.parentId : null;
      const list = childrenMap.get(pId) ?? [];
      list.push(page);
      childrenMap.set(pId, list);
    }

    const buildTree = (
      parentId: string | null,
      currentDepth: number,
    ): PageTreeItem[] => {
      if (currentDepth > maxDepth) return [];
      const children = childrenMap.get(parentId) ?? [];
      const result: PageTreeItem[] = [];

      for (const child of children) {
        const subChildren = buildTree(child.id, currentDepth + 1);
        result.push({
          id: child.id,
          title: child.title,
          icon: child.icon ?? null,
          parentId: child.parentId ?? null,
          ...(subChildren.length > 0 ? { children: subChildren } : {}),
        });
      }

      return result;
    };

    let tree: PageTreeItem[] = [];
    if (rootPageId) {
      const rootPage = pageMap.get(rootPageId);
      if (rootPage) {
        const children = buildTree(rootPage.id, 2);
        tree = [
          {
            id: rootPage.id,
            title: rootPage.title,
            icon: rootPage.icon ?? null,
            parentId: rootPage.parentId ?? null,
            ...(children.length > 0 ? { children: children } : {}),
          },
        ];
      }
    } else {
      tree = buildTree(null, 1);
    }

    return Result.ok(tree);
  }

  async createPage(
    input: CreatePageInput,
  ): Promise<Result<Page, DatabaseError>> {
    return Result.gen(async function* (this: PagesService) {
      const page = yield* Result.await(
        this.pagesRepository.createPage({ input }),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "page.created",
          aggregateId: page.id,
          payload: {
            workspaceId: input.workspaceId,
            page,
          },
        }),
      );

      return Result.ok(page);
    }, this);
  }

  async getPageById({
    pageId,
  }: {
    pageId: PageId;
  }): Promise<Result<Page, DatabaseError | NotFoundError>> {
    return this.pagesRepository.getPageById({ pageId });
  }

  async getPagesByIds({
    pageIds,
  }: {
    pageIds: PageId[];
  }): Promise<Result<Page[], DatabaseError>> {
    return this.pagesRepository.getPagesByIds({ pageIds });
  }

  async getPageWithoutContent({
    workspaceId,
    pageId,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
  }): Promise<Result<Omit<Page, "content">, DatabaseError | NotFoundError>> {
    return this.pagesRepository.getPageWithoutContent({ workspaceId, pageId });
  }

  async getPageContent({
    pageId,
  }: {
    pageId: PageId;
  }): Promise<Result<Uint8Array | null, DatabaseError>> {
    return this.pagesRepository.getPageContent({ pageId });
  }

  async updatePageContent({
    pageId,
    content,
  }: {
    pageId: PageId;
    content: Uint8Array;
  }): Promise<Result<true, DatabaseError>> {
    return this.pagesRepository.updatePageContent({ pageId, content });
  }

  async updatePageContentWithOutbox({
    pageId,
    content,
    workspaceId,
    version,
  }: {
    pageId: PageId;
    content: Uint8Array;
    workspaceId: WorkspaceId;
    version?: number;
  }): Promise<Result<true, DatabaseError>> {
    return this.dbClient.transaction(async (tx) => {
      return Result.gen(async function* (this: PagesService) {
        yield* Result.await(
          this.pagesRepository.updatePageContentTx({ tx, pageId, content }),
        );
        yield* Result.await(
          this.outboxService.upsertEntryTx({
            tx,
            input: {
              type: "page_indexing",
              aggregateId: pageId,
              payload: {
                workspaceId,
                pageId,
                version,
              },
            },
          }),
        );
        return Result.ok(true as const);
      }, this).then(
        Result.tapError(() => {
          tx.rollback();
        }),
      );
    });
  }

  async updatePageMetadata({
    pageId,
    data,
  }: {
    pageId: PageId;
    data: UpdatePageMetadataInput;
  }): Promise<Result<Page, DatabaseError | NotFoundError>> {
    return this.pagesRepository.updatePageMetadata({ pageId, data });
  }

  async updatePageMetadataWithOutbox({
    pageId,
    data,
    workspaceId,
  }: {
    pageId: PageId;
    data: UpdatePageMetadataInput;
    workspaceId: WorkspaceId;
  }): Promise<Result<Page, DatabaseError | NotFoundError>> {
    return this.dbClient.transaction(async (tx) => {
      return Result.gen(async function* (this: PagesService) {
        const page = yield* Result.await(
          this.pagesRepository.updatePageMetadataTx({ tx, pageId, data }),
        );
        if (data.title !== undefined) {
          yield* Result.await(
            this.outboxService.upsertEntryTx({
              tx,
              input: {
                type: "page_indexing",
                aggregateId: pageId,
                payload: {
                  workspaceId,
                  pageId,
                },
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

  async getPagePermissions({
    workspaceId,
    pageId,
    pagination,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
    pagination: PaginationQuery;
  }): Promise<Result<PaginatedData<PageMemberPermission>, DatabaseError>> {
    return Result.gen(async function* (this: PagesService) {
      const [permRows, membersPaginated] = yield* Result.await(
        Result.allAsync([
          this.pagesRepository.getPagePermissions({ pageId }),
          this.workspacesService.getMembers({ workspaceId, pagination }),
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
          role:
            member.role === "owner"
              ? "editor"
              : (permMap.get(member.userId) ?? "viewer"),
          workspaceRole: member.role,
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
        this.pagesRepository.setPagePermission({
          workspaceId,
          pageId,
          userId: targetUserId,
          role,
        }),
      );

      const [page, user] = yield* Result.await(
        Result.allAsync([
          this.pagesRepository.getPageById({ pageId }),
          this.usersService.getUserById({ userId: targetUserId }),
        ]),
      );

      const pageTitle = page.title || "a page";

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "page.permission_updated",
          aggregateId: pageId,
          payload: {
            workspaceId,
            pageId,
            targetUserId,
            role,
            updatedByUserId: changedBy.id,
            pageTitle,
            updatedByName: changedBy.name,
          },
        }),
      );

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
        this.pagesRepository.createAccessRequest({
          workspaceId,
          pageId,
          userId: requester.id,
          requestedRole,
        }),
      );

      const [page, ownerUserId] = yield* Result.await(
        Result.allAsync([
          this.pagesRepository.getPageWithoutContent({ workspaceId, pageId }),
          this.workspacesService.getWorkspaceOwnerUserId({ workspaceId }),
        ]),
      );

      const pageTitle = page.title || "a page";

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "page.access_requested",
          aggregateId: createdRequest.id,
          payload: {
            workspaceId,
            pageId,
            pageTitle,
            pageIcon: page.icon ?? null,
            requesterId: requester.id,
            requesterName: requester.name,
            requesterEmail: requester.email,
            recipientUserId: ownerUserId,
            requestedRole,
            requestId: createdRequest.id,
          },
        }),
      );

      return Result.ok(createdRequest);
    }, this);
  }

  async getAccessRequestStatus({
    pageId,
    userId,
  }: {
    pageId: PageId;
    userId: UserId;
  }) {
    return this.pagesRepository
      .getPendingAccessRequestForUser({ pageId, userId })
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
              this.pagesRepository.getAccessRequestById({ requestId }),
            );

            yield* Result.await(
              this.pagesRepository.setPagePermissionTx({
                tx,
                workspaceId,
                pageId,
                userId: request.userId,
                role: request.requestedRole,
              }),
            );

            const updateReqResult = yield* Result.await(
              this.pagesRepository.updateAccessRequestStatusTx({
                tx,
                requestId,
                status: "approved",
              }),
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

      const pageResult = await this.pagesRepository.getPageById({ pageId });
      const pageTitle = pageResult.isOk() ? pageResult.value.title : "a page";

      yield* Result.await(
        this.eventDispatcher.dispatchBatch([
          {
            type: "page.access_request_resolved",
            aggregateId: requestId,
            payload: {
              workspaceId,
              pageId,
              pageTitle,
              pageIcon: null,
              requesterId,
              reviewerId: approver.id,
              reviewerName: approver.name,
              status: "approved",
              role: grantedRole,
              requestId,
            },
          },
          {
            type: "page.permission_updated",
            aggregateId: pageId,
            payload: {
              workspaceId,
              pageId,
              targetUserId: requesterId,
              role: grantedRole,
              updatedByUserId: approver.id,
              pageTitle,
              updatedByName: approver.name,
            },
          },
        ]),
      );

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
        this.pagesRepository.getAccessRequestById({ requestId }),
      );

      const updatedRequest = yield* Result.await(
        this.pagesRepository.updateAccessRequestStatus({
          requestId,
          status: "rejected",
        }),
      );

      const pageResult = await this.pagesRepository.getPageById({ pageId });

      const pageTitle = pageResult.isOk() ? pageResult.value.title : "a page";

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "page.access_request_resolved",
          aggregateId: requestId,
          payload: {
            workspaceId,
            pageId,
            pageTitle,
            pageIcon: null,
            requesterId: request.userId,
            reviewerId: rejecter.id,
            reviewerName: rejecter.name,
            status: "rejected",
            role: request.requestedRole,
            requestId,
          },
        }),
      );

      return Result.ok(updatedRequest);
    }, this);
  }

  async loadPageResourceData({
    pageId,
    userId,
  }: {
    pageId: PageId;
    userId: UserId;
  }): Promise<Result<ResourceData<"page"> | null, DatabaseError>> {
    return Result.gen(async function* (this: PagesService) {
      const page = yield* Result.await(
        this.pagesRepository.getPageById({ pageId }).then((res) => {
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
          this.pagesRepository.getPagePermissionForUser({ pageId, userId }),
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
        this.pagesRepository.getPageById({ pageId }).then((res) => {
          if (res.isOk()) return Result.ok(res.value);
          if (NotFoundError.is(res.error)) return Result.ok(null);
          return Result.err(res.error);
        }),
      );
      if (!page) return Result.ok(null);

      const [targetRole, callerWsScope, targetWsScope] = yield* Result.await(
        Result.allAsync([
          this.pagesRepository.getPagePermissionForUser({
            pageId,
            userId: targetUserId,
          }),
          this.workspacesService.loadWorkspaceScopeData({
            workspaceId: page.workspaceId,
            userId: callerUserId,
          }),
          this.workspacesService.loadWorkspaceScopeData({
            workspaceId: page.workspaceId,
            userId: targetUserId,
          }),
        ]),
      );

      return Result.ok({
        pageId,
        workspaceId: page.workspaceId,
        targetUserId,
        targetRole,
        targetUserWorkspaceRole: targetWsScope?.userRole ?? null,
        userWorkspaceRole: callerWsScope?.userRole ?? null,
      });
    }, this);
  }

  async loadPageScopeData({
    workspaceId,
    userId,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<ScopeData<"page"> | null, DatabaseError>> {
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
    pageId: PageId;
    userId: UserId;
  }): Promise<Result<ScopeData<"pagePermission"> | null, DatabaseError>> {
    return Result.gen(async function* (this: PagesService) {
      const page = yield* Result.await(
        this.pagesRepository.getPageById({ pageId }).then((res) => {
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

  async getTrashedPages({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<Page[], DatabaseError>> {
    return this.pagesRepository.getTrashedPages({ workspaceId });
  }

  async moveToTrash({
    workspaceId,
    pageId,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
  }): Promise<Result<{ success: true }, DatabaseError | NotFoundError>> {
    return Result.gen(async function* (this: PagesService) {
      const page = yield* Result.await(
        this.pagesRepository.getPageWithoutContent({ workspaceId, pageId }),
      );

      const descendants = yield* Result.await(
        this.pagesRepository.getDescendantPageIds({ workspaceId, pageId }),
      );
      const allPageIdsToTrash = [page.id, ...descendants];

      yield* Result.await(
        this.pagesRepository.moveToTrash({ pageIds: allPageIdsToTrash }),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "page.moved_to_trash",
          aggregateId: pageId,
          payload: {
            workspaceId,
            pageId,
            descendantIds: descendants,
          },
        }),
      );

      return Result.ok({ success: true as const });
    }, this);
  }

  async restoreFromTrash({
    workspaceId,
    pageId,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
  }): Promise<Result<Page, DatabaseError | NotFoundError>> {
    return Result.gen(async function* (this: PagesService) {
      const [page, descendants] = yield* Result.await(
        Result.allAsync([
          this.pagesRepository.getPageWithoutContent({ workspaceId, pageId }),
          this.pagesRepository.getDescendantPageIds({ workspaceId, pageId }),
        ]),
      );

      let targetParentId = page.parentId;
      if (targetParentId) {
        const parentRes = await this.pagesRepository.getPageWithoutContent({
          workspaceId,
          pageId: targetParentId,
        });
        if (parentRes.isErr() || parentRes.value.inTrash) {
          targetParentId = null;
        }
      }

      const restored = yield* Result.await(
        this.pagesRepository.restoreFromTrash({
          pageId,
          parentId: targetParentId,
          descendantIds: descendants,
        }),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "page.restored",
          aggregateId: pageId,
          payload: {
            workspaceId,
            page: restored,
            descendantIds: descendants,
          },
        }),
      );

      return Result.ok(restored);
    }, this);
  }

  async deletePermanently({
    workspaceId,
    pageId,
  }: {
    workspaceId: WorkspaceId;
    pageId: PageId;
  }): Promise<Result<{ success: true }, DatabaseError | NotFoundError>> {
    return Result.gen(async function* (this: PagesService) {
      const descendants = yield* Result.await(
        this.pagesRepository.getDescendantPageIds({ workspaceId, pageId }),
      );
      const allPageIdsToDelete = [pageId, ...descendants];

      yield* Result.await(
        this.pagesRepository.deletePermanently({
          pageIds: allPageIdsToDelete,
        }),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "page.deleted_permanently",
          aggregateId: pageId,
          payload: {
            workspaceId,
            pageId,
            allPageIds: allPageIdsToDelete,
          },
        }),
      );

      return Result.ok({ success: true as const });
    }, this);
  }

  async emptyTrash({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<{ success: true }, DatabaseError>> {
    return Result.gen(async function* (this: PagesService) {
      const deletedPageIds = yield* Result.await(
        this.pagesRepository.emptyTrash({ workspaceId }),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "workspace.trash_emptied",
          aggregateId: workspaceId,
          payload: {
            workspaceId,
            allPageIds: deletedPageIds,
          },
        }),
      );

      return Result.ok({ success: true as const });
    }, this);
  }
}
