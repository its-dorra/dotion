import type { UserId } from "@dotion/shared/users/types";
import type {
  CreateWorkspaceInput,
  InviteMemberInput,
  Workspace,
  WorkspaceId,
  WorkspaceInvitationId,
  WorkspaceMemberDetail,
  WorkspaceInvitationWithDetails,
  WorkspaceRole,
} from "@dotion/shared/workspaces/types";
import type {
  PaginationQuery,
  PaginatedData,
} from "@dotion/shared/pagination/types";
import type { DBClient } from "@dotion/db";
import {
  DatabaseError,
  NotFoundError,
  UniqueConstraintViolationError,
} from "@dotion/db";
import { Result } from "better-result";
import type { WorkspacesRepository } from "@dotion/db/repositories";
import type { UsersService } from "./users.service";
import type { OutboxService } from "./outbox.service";
import type { DomainEventDispatcher } from "./event-dispatcher.types";
import type {
  ResourceData,
  ScopeData,
} from "@dotion/shared/authorization/types";

export class WorkspacesService {
  constructor(
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly usersService: UsersService,
    private readonly dbClient: DBClient,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly outboxService: OutboxService,
  ) {}

  async getAllWorkspaces({ userId }: { userId: UserId }) {
    return this.workspacesRepository.getAllWorkspaces({ userId });
  }

  async createWorkspace({
    input,
    userId,
  }: {
    input: CreateWorkspaceInput;
    userId: UserId;
  }) {
    return this.dbClient.transaction(async (tx) => {
      return Result.gen(async function* (this: WorkspacesService) {
        const workspace = yield* Result.await(
          this.workspacesRepository.createWorkspaceTx({ tx, input }),
        );
        yield* Result.await(
          this.workspacesRepository.createWorkspaceMemberTx({
            tx,
            input: {
              workspaceId: workspace.id,
              userId,
              role: "owner",
            },
          }),
        );
        return Result.ok(workspace);
      }, this).then(
        Result.tapError(() => {
          tx.rollback();
        }),
      );
    });
  }

  async getWorkspaceById({
    workspaceId,
    userId,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }) {
    return this.workspacesRepository.getById({ workspaceId, userId });
  }

  async searchCandidateUsers({
    workspaceId,
    query,
    pagination,
  }: {
    workspaceId: WorkspaceId;
    query: string;
    pagination: PaginationQuery;
  }) {
    return Result.gen(async function* (this: WorkspacesService) {
      const [memberUserIds, pendingInvitedUserIds] = yield* Result.await(
        Result.allAsync([
          this.workspacesRepository.getMemberUserIds({ workspaceId }),
          this.workspacesRepository.getPendingInvitedUserIds({ workspaceId }),
        ]),
      );

      const excludeUserIds = Array.from(
        new Set([...memberUserIds, ...pendingInvitedUserIds]),
      );

      const users = yield* Result.await(
        this.usersService.searchUsers({
          query,
          excludeUserIds,
          pagination,
        }),
      );

      return Result.ok(users);
    }, this);
  }

  async getMembers({
    workspaceId,
    pagination,
  }: {
    workspaceId: WorkspaceId;
    pagination: PaginationQuery;
  }): Promise<Result<PaginatedData<WorkspaceMemberDetail>, DatabaseError>> {
    return Result.gen(async function* (this: WorkspacesService) {
      const membersResult = yield* Result.await(
        this.workspacesRepository.getMembers({ workspaceId, pagination }),
      );

      const memberRows = membersResult.payload;
      const userIds = memberRows.map((m) => m.userId);

      const users = yield* Result.await(
        this.usersService.getUsersByIds({ userIds }),
      );
      const usersMap = new Map(users.map((u) => [u.id, u]));

      const payload: WorkspaceMemberDetail[] = memberRows.map((m) => {
        const user = usersMap.get(m.userId);
        return {
          id: `${m.workspaceId}_${m.userId}`,
          userId: m.userId,
          name: user?.name ?? "Unknown User",
          email: user?.email ?? "",
          avatarUrl: user?.image ?? null,
          role: m.role,
          joinedAt: m.createdAt,
        };
      });

      return Result.ok({
        pagination: membersResult.pagination,
        payload,
      });
    }, this);
  }

  async getWorkspaceOwnerUserId({ workspaceId }: { workspaceId: WorkspaceId }) {
    return this.workspacesRepository.getWorkspaceOwnerUserId({ workspaceId });
  }

  async inviteMember({
    workspaceId,
    inviterId,
    input,
  }: {
    workspaceId: WorkspaceId;
    inviterId: UserId;
    input: InviteMemberInput;
  }): Promise<
    Result<
      WorkspaceInvitationWithDetails,
      DatabaseError | NotFoundError | UniqueConstraintViolationError
    >
  > {
    const targetUserPromise = input.userId
      ? this.usersService.getUserById({ userId: input.userId })
      : input.email
        ? this.usersService.getUserByEmail({ email: input.email })
        : null;

    if (!targetUserPromise) {
      return Result.err(
        new NotFoundError({ message: "User to invite not found" }),
      );
    }

    return Result.gen(async function* (this: WorkspacesService) {
      const targetUser = yield* Result.await(
        targetUserPromise.then(
          Result.mapError(
            () => new NotFoundError({ message: "User to invite not found" }),
          ),
        ),
      );

      const [inviterUser, workspace, pendingInvitation, isAlreadyMember] =
        yield* Result.await(
          Result.allAsync([
            this.usersService.getUserById({ userId: inviterId }),
            this.workspacesRepository.getWorkspaceOnly({ workspaceId }),
            this.workspacesRepository.getPendingInvitationForUser({
              workspaceId,
              userId: targetUser.id,
            }),
            this.workspacesRepository.isMember({
              workspaceId,
              userId: targetUser.id,
            }),
          ]),
        );

      if (isAlreadyMember) {
        yield* new DatabaseError({
          message: "User is already a member of this workspace",
        });
      }

      if (pendingInvitation) {
        yield* new DatabaseError({
          message: "A pending invitation already exists for this user",
        });
      }

      const inviterName = inviterUser.name || "A member";

      const txResult = yield* Result.await(
        this.dbClient.transaction(async (tx) => {
          return Result.gen(async function* (this: WorkspacesService) {
            const invitation = yield* Result.await(
              this.workspacesRepository.createInvitationTx({
                tx,
                input: {
                  workspaceId,
                  invitedUserId: targetUser.id,
                  invitedByUserId: inviterId,
                  status: "pending",
                },
              }),
            );

            const invitationWithDetails: WorkspaceInvitationWithDetails = {
              ...invitation,
              workspaceName: workspace.name,
              workspaceIcon: workspace.icon ?? null,
              invitedByName: inviterName,
              invitedUserEmail: targetUser.email,
              invitedUserName: targetUser.name,
            };

            yield* Result.await(
              this.outboxService.emitEventTx({
                tx,
                event: {
                  type: "workspace.invitation_created",
                  aggregateId: invitation.id,
                  payload: {
                    workspaceId,
                    invitation: invitationWithDetails,
                    invitedUserId: targetUser.id,
                    invitedByUserId: inviterId,
                  },
                },
              }),
            );

            return Result.ok(invitationWithDetails);
          }, this).then(
            Result.tapError(() => {
              tx.rollback();
            }),
          );
        }),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "workspace.invitation_created",
          aggregateId: txResult.id,
          payload: {
            workspaceId,
            invitation: txResult,
            invitedUserId: targetUser.id,
            invitedByUserId: inviterId,
          },
        }),
      );

      return Result.ok(txResult);
    }, this);
  }

  async getWorkspaceInvitations({
    workspaceId,
    pagination,
  }: {
    workspaceId: WorkspaceId;
    pagination: PaginationQuery;
  }): Promise<
    Result<
      PaginatedData<WorkspaceInvitationWithDetails>,
      DatabaseError | NotFoundError
    >
  > {
    return Result.gen(async function* (this: WorkspacesService) {
      const invitesResult = yield* Result.await(
        this.workspacesRepository.getPendingInvitationsForWorkspace({
          workspaceId,
          pagination,
        }),
      );

      const invites = invitesResult.payload;
      const userIds = [
        ...invites.map((i) => i.invitedUserId),
        ...invites.map((i) => i.invitedByUserId),
      ];

      const [users, workspace] = yield* Result.await(
        Result.allAsync([
          this.usersService.getUsersByIds({ userIds }),
          this.workspacesRepository.getWorkspaceOnly({ workspaceId }),
        ]),
      );

      const usersMap = new Map(users.map((u) => [u.id, u]));

      const payload: WorkspaceInvitationWithDetails[] = invites.map((inv) => {
        const invitedUser = usersMap.get(inv.invitedUserId);
        const invitedByUser = usersMap.get(inv.invitedByUserId);
        return {
          ...inv,
          workspaceName: workspace.name,
          workspaceIcon: workspace.icon ?? null,
          invitedByName: invitedByUser?.name ?? "Unknown",
          invitedUserEmail: invitedUser?.email ?? "",
          invitedUserName: invitedUser?.name ?? "Unknown",
        };
      });

      return Result.ok({
        pagination: invitesResult.pagination,
        payload,
      });
    }, this);
  }

  async acceptInvitation({
    invitationId,
    userId,
  }: {
    invitationId: WorkspaceInvitationId;
    userId: UserId;
  }): Promise<
    Result<
      Workspace,
      DatabaseError | NotFoundError | UniqueConstraintViolationError
    >
  > {
    return Result.gen(async function* (this: WorkspacesService) {
      const invitation = yield* Result.await(
        this.workspacesRepository.getInvitationById({ invitationId }),
      );

      if (invitation.invitedUserId !== userId) {
        yield* new DatabaseError({
          message: "You are not the recipient of this invitation",
        });
      }

      if (invitation.status !== "pending") {
        yield* new DatabaseError({
          message: `Invitation is already ${invitation.status}`,
        });
      }

      const txResult = yield* Result.await(
        this.dbClient.transaction(async (tx) => {
          return Result.gen(async function* (this: WorkspacesService) {
            yield* Result.await(
              this.workspacesRepository.updateInvitationStatusTx({
                tx,
                invitationId,
                status: "accepted",
              }),
            );

            yield* Result.await(
              this.workspacesRepository.createWorkspaceMemberTx({
                tx,
                input: {
                  workspaceId: invitation.workspaceId,
                  userId,
                  role: "member",
                },
              }),
            );

            await this.workspacesRepository.incrementMembersCountTx({
              tx,
              workspaceId: invitation.workspaceId,
            });

            const [workspace, user] = yield* Result.await(
              Result.allAsync([
                this.workspacesRepository.getWorkspaceOnly({
                  workspaceId: invitation.workspaceId,
                }),
                this.usersService.getUserById({ userId }),
              ]),
            );

            const memberDetail: WorkspaceMemberDetail = {
              id: `${invitation.workspaceId}_${userId}`,
              userId,
              name: user.name ?? "Member",
              email: user.email,
              avatarUrl: user.image ?? null,
              role: "member",
              joinedAt: new Date(),
            };

            return Result.ok({
              workspace,
              member: memberDetail,
              invitation,
            });
          }, this).then(
            Result.tapError(() => {
              tx.rollback();
            }),
          );
        }),
      );

      const { workspace, member, invitation: inv } = txResult;
      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "workspace.member_joined",
          aggregateId: workspace.id,
          payload: {
            workspaceId: workspace.id,
            invitationId: inv.id,
            member,
            userId,
          },
        }),
      );
      return Result.ok(workspace);
    }, this);
  }

  async declineInvitation({
    invitationId,
    userId,
  }: {
    invitationId: WorkspaceInvitationId;
    userId: UserId;
  }) {
    return Result.gen(async function* (this: WorkspacesService) {
      const invitation = yield* Result.await(
        this.workspacesRepository.getInvitationById({ invitationId }),
      );

      if (invitation.invitedUserId !== userId) {
        yield* new DatabaseError({
          message: "You are not the recipient of this invitation",
        });
      }

      if (invitation.status !== "pending") {
        yield* new DatabaseError({
          message: `Invitation is already ${invitation.status}`,
        });
      }

      yield* Result.await(
        this.workspacesRepository.updateInvitationStatus({
          invitationId,
          status: "declined",
        }),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "workspace.invitation_declined",
          aggregateId: invitation.id,
          payload: {
            workspaceId: invitation.workspaceId,
            invitationId: invitation.id,
          },
        }),
      );
      return Result.ok(true as const);
    }, this);
  }

  async cancelInvitation({
    workspaceId,
    invitationId,
  }: {
    workspaceId: WorkspaceId;
    invitationId: WorkspaceInvitationId;
  }) {
    return Result.gen(async function* (this: WorkspacesService) {
      yield* Result.await(
        this.workspacesRepository.updateInvitationStatus({
          invitationId,
          status: "cancelled",
        }),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "workspace.invitation_cancelled",
          aggregateId: invitationId,
          payload: {
            workspaceId,
            invitationId,
          },
        }),
      );

      return Result.ok(true as const);
    }, this);
  }

  async updateMemberRole({
    workspaceId,
    targetUserId,
    newRole,
  }: {
    workspaceId: WorkspaceId;
    targetUserId: UserId;
    newRole: WorkspaceRole;
  }): Promise<Result<WorkspaceMemberDetail, DatabaseError | NotFoundError>> {
    return Result.gen(async function* (this: WorkspacesService) {
      const targetMember = yield* Result.await(
        this.workspacesRepository.getMember({
          workspaceId,
          userId: targetUserId,
        }),
      );

      if (targetMember.role === "owner") {
        yield* new DatabaseError({
          message: "The workspace owner's role cannot be modified",
        });
      }

      if (newRole === "owner") {
        yield* new DatabaseError({
          message: "Cannot assign owner role through role update",
        });
      }

      const updatedRow = yield* Result.await(
        this.workspacesRepository.updateMemberRole({
          workspaceId,
          userId: targetUserId,
          role: newRole,
        }),
      );

      const userResult = await this.usersService.getUserById({
        userId: targetUserId,
      });
      const user = userResult.isOk() ? userResult.value : null;

      const memberDetail: WorkspaceMemberDetail = {
        id: `${workspaceId}_${targetUserId}`,
        userId: targetUserId,
        name: user?.name ?? "Member",
        email: user?.email ?? "",
        avatarUrl: user?.image ?? null,
        role: newRole,
        joinedAt: updatedRow.createdAt,
      };

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "workspace.member_joined",
          aggregateId: workspaceId,
          payload: {
            workspaceId,
            invitationId: "",
            member: memberDetail,
            userId: targetUserId,
          },
        }),
      );
      return Result.ok(memberDetail);
    }, this);
  }

  async removeMember({
    workspaceId,
    targetUserId,
  }: {
    workspaceId: WorkspaceId;
    targetUserId: UserId;
  }) {
    return Result.gen(async function* (this: WorkspacesService) {
      const targetMember = yield* Result.await(
        this.workspacesRepository.getMember({
          workspaceId,
          userId: targetUserId,
        }),
      );

      if (targetMember.role === "owner") {
        yield* new DatabaseError({
          message: "The workspace owner cannot be removed",
        });
      }

      yield* Result.await(
        this.dbClient.transaction(async (tx) => {
          return Result.gen(async function* (this: WorkspacesService) {
            yield* Result.await(
              this.workspacesRepository.removeMemberTx({
                tx,
                workspaceId,
                userId: targetUserId,
              }),
            );
            await this.workspacesRepository.decrementMembersCountTx({
              tx,
              workspaceId,
            });
            return Result.ok(true as const);
          }, this).then(
            Result.tapError(() => {
              tx.rollback();
            }),
          );
        }),
      );

      yield* Result.await(
        this.eventDispatcher.dispatch({
          type: "workspace.member_removed",
          aggregateId: workspaceId,
          payload: {
            workspaceId,
            userId: targetUserId,
          },
        }),
      );
      return Result.ok(true as const);
    }, this);
  }

  async loadWorkspaceResourceData({
    workspaceId,
    userId,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<ResourceData<"workspace">, DatabaseError>> {
    return this.workspacesRepository
      .getMember({ workspaceId, userId })
      .then((res) => {
        if (res.isOk()) {
          return Result.ok({
            workspaceId,
            userRole: res.value?.role ?? null,
          });
        }
        if (NotFoundError.is(res.error)) {
          return Result.ok({
            workspaceId,
            userRole: null,
          });
        }
        return Result.err(res.error);
      });
  }

  async loadWorkspaceMemberResourceData({
    workspaceId,
    targetUserId,
    callerUserId,
  }: {
    workspaceId: WorkspaceId;
    targetUserId: UserId;
    callerUserId: UserId;
  }): Promise<Result<ResourceData<"workspaceMember"> | null, DatabaseError>> {
    const [targetRes, callerRes] = await Promise.all([
      this.workspacesRepository.getMember({
        workspaceId,
        userId: targetUserId,
      }),
      this.workspacesRepository.getMember({
        workspaceId,
        userId: callerUserId,
      }),
    ]);

    if (targetRes.isErr() && !NotFoundError.is(targetRes.error)) {
      return Result.err(targetRes.error);
    }
    if (callerRes.isErr() && !NotFoundError.is(callerRes.error)) {
      return Result.err(callerRes.error);
    }

    const targetMember = targetRes.isOk() ? targetRes.value : null;
    if (!targetMember) return Result.ok(null);

    const callerMember = callerRes.isOk() ? callerRes.value : null;

    return Result.ok({
      workspaceId,
      targetUserId,
      targetRole: targetMember.role,
      userRole: callerMember?.role ?? null,
    });
  }

  async loadWorkspaceInvitationResourceData({
    invitationId,
    callerUserId,
  }: {
    invitationId: WorkspaceInvitationId;
    callerUserId: UserId;
  }): Promise<
    Result<ResourceData<"workspaceInvitation"> | null, DatabaseError>
  > {
    return Result.gen(async function* (this: WorkspacesService) {
      const invitation = yield* Result.await(
        this.workspacesRepository
          .getInvitationById({ invitationId })
          .then((res) => {
            if (res.isOk()) return Result.ok(res.value);
            if (NotFoundError.is(res.error)) return Result.ok(null);
            return Result.err(res.error);
          }),
      );
      if (!invitation) return Result.ok(null);

      const callerMember = yield* Result.await(
        this.workspacesRepository
          .getMember({
            workspaceId: invitation.workspaceId,
            userId: callerUserId,
          })
          .then((res) => {
            if (res.isOk()) return Result.ok(res.value);
            if (NotFoundError.is(res.error)) return Result.ok(null);
            return Result.err(res.error);
          }),
      );

      return Result.ok({
        invitationId,
        workspaceId: invitation.workspaceId,
        invitedUserId: invitation.invitedUserId,
        invitedByUserId: invitation.invitedByUserId,
        userRole: callerMember?.role ?? null,
      });
    }, this);
  }

  async loadWorkspaceScopeData({
    workspaceId,
    userId,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<ScopeData<"workspaceMember"> | null, DatabaseError>> {
    return this.workspacesRepository
      .getMember({ workspaceId, userId })
      .then((res) => {
        if (res.isOk()) {
          return Result.ok({
            workspaceId,
            userRole: res.value?.role ?? null,
          });
        }
        if (NotFoundError.is(res.error)) {
          return Result.ok({
            workspaceId,
            userRole: null,
          });
        }
        return Result.err(res.error);
      });
  }
}
