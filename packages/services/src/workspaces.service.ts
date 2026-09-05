import type { UserId } from "@dotion/shared/users/types";
import type {
  CreateWorkspaceInput,
  InviteMemberInput,
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
import type { NotificationsService } from "./notifications.service";
import type {
  PermissionCacheInvalidator,
  WorkspaceEventPublisher,
  UserEventPublisher,
} from "./realtime.types";
import type {
  ResourceData,
  ScopeData,
} from "@dotion/shared/authorization/types";

export class WorkspacesService {
  constructor(
    private readonly workspacesRepository: WorkspacesRepository,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly dbClient: DBClient,
    private readonly cacheInvalidator?: PermissionCacheInvalidator,
    private readonly workspaceEventPublisher?: WorkspaceEventPublisher,
    private readonly userEventPublisher?: UserEventPublisher,
  ) {}

  async getAllWorkspaces(userId: UserId) {
    return this.workspacesRepository.getAllWorkspaces(userId);
  }

  async createWorkspace(input: CreateWorkspaceInput, userId: UserId) {
    return this.dbClient.transaction(async (tx) => {
      return this.workspacesRepository
        .createWorkspace(tx, input)
        .then(
          Result.andThenAsync(async (workspace) => {
            const workspaceMember =
              await this.workspacesRepository.createWorkspaceMember(tx, {
                workspaceId: workspace.id,
                userId,
                role: "owner",
              });

            if (workspaceMember.isErr())
              return Result.err(workspaceMember.error);

            return Result.ok(workspace);
          }),
        )
        .then(
          Result.tapError(() => {
            tx.rollback();
          }),
        );
    });
  }

  async getWorkspaceById(workspaceId: WorkspaceId, userId: UserId) {
    return this.workspacesRepository.getById(workspaceId, userId);
  }

  async searchCandidateUsers({
    workspaceId,
    query,
    pagination,
  }: {
    workspaceId: WorkspaceId;
    query: string;
    pagination: PaginationQuery;
    currentUserId?: UserId;
  }) {
    const idsResult = await Result.allAsync([
      this.workspacesRepository.getMemberUserIds(workspaceId),
      this.workspacesRepository.getPendingInvitedUserIds(workspaceId),
    ]);

    if (idsResult.isErr()) {
      return Result.err(idsResult.error);
    }

    const [memberUserIds, pendingInvitedUserIds] = idsResult.value;
    const excludeUserIds = Array.from(
      new Set([...memberUserIds, ...pendingInvitedUserIds]),
    );

    return this.usersService.searchUsers({
      query,
      excludeUserIds,
      pagination,
    });
  }

  async getMembers(
    workspaceId: WorkspaceId,
    pagination: PaginationQuery,
  ): Promise<Result<PaginatedData<WorkspaceMemberDetail>, DatabaseError>> {
    const membersResult = await this.workspacesRepository.getMembers(
      workspaceId,
      pagination,
    );
    if (membersResult.isErr()) {
      return Result.err(membersResult.error);
    }

    const memberRows = membersResult.value.payload;
    const userIds = memberRows.map((m) => m.userId);

    const usersResult = await this.usersService.getUsersByIds(userIds);
    if (usersResult.isErr()) {
      return Result.err(usersResult.error);
    }

    const usersMap = new Map(usersResult.value.map((u) => [u.id, u]));

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
      pagination: membersResult.value.pagination,
      payload,
    });
  }

  async getWorkspaceOwnerUserId(workspaceId: WorkspaceId) {
    return this.workspacesRepository.getWorkspaceOwnerUserId(workspaceId);
  }

  async inviteMember(
    workspaceId: WorkspaceId,
    inviterId: UserId,
    input: InviteMemberInput,
  ): Promise<
    Result<
      WorkspaceInvitationWithDetails,
      DatabaseError | NotFoundError | UniqueConstraintViolationError
    >
  > {
    const targetUserResult = input.userId
      ? await this.usersService.getUserById(input.userId)
      : input.email
        ? await this.usersService.getUserByEmail(input.email)
        : null;

    if (!targetUserResult || targetUserResult.isErr()) {
      return Result.err(
        new NotFoundError({ message: "User to invite not found" }),
      );
    }

    const targetUser = targetUserResult.value;

    const initialChecks = await Result.allAsync([
      this.usersService.getUserById(inviterId),
      this.workspacesRepository.getWorkspaceOnly(workspaceId),
      this.workspacesRepository.getPendingInvitationForUser(
        workspaceId,
        targetUser.id,
      ),
      this.workspacesRepository.isMember(workspaceId, targetUser.id),
    ]);

    if (initialChecks.isErr()) {
      return Result.err(initialChecks.error);
    }

    const [inviterUser, workspace, pendingInvitation, isAlreadyMember] =
      initialChecks.value;

    if (isAlreadyMember) {
      return Result.err(
        new DatabaseError({
          message: "User is already a member of this workspace",
        }),
      );
    }

    if (pendingInvitation) {
      return Result.err(
        new DatabaseError({
          message: "A pending invitation already exists for this user",
        }),
      );
    }

    const inviterName = inviterUser.name || "A member";

    const txResult = await this.dbClient.transaction(async (tx) => {
      const invitationResult = await this.workspacesRepository.createInvitation(
        tx,
        {
          workspaceId,
          invitedUserId: targetUser.id,
          invitedByUserId: inviterId,
          status: "pending",
        },
      );

      if (invitationResult.isErr()) {
        tx.rollback();
        return Result.err(invitationResult.error);
      }

      const invitation = invitationResult.value;

      const notificationResult =
        await this.notificationsService.createNotificationTx(tx, {
          userId: targetUser.id,
          metadata: {
            type: "workspace_invitation",
            workspaceInvitationId: invitation.id,
            workspaceId: workspace.id,
            workspaceName: workspace.name,
            workspaceIcon: workspace.icon ?? undefined,
            invitedByUserId: inviterId,
            invitedByName: inviterName,
          },
          isRead: false,
        });

      if (notificationResult.isErr()) {
        tx.rollback();
        return Result.err(notificationResult.error);
      }

      const invitationWithDetails: WorkspaceInvitationWithDetails = {
        ...invitation,
        workspaceName: workspace.name,
        workspaceIcon: workspace.icon ?? null,
        invitedByName: inviterName,
        invitedUserEmail: targetUser.email,
        invitedUserName: targetUser.name,
      };

      return Result.ok({
        invitation: invitationWithDetails,
        notification: notificationResult.value,
        targetUserId: targetUser.id,
      });
    });

    if (txResult.isOk()) {
      const { invitation, notification, targetUserId } = txResult.value;
      await this.userEventPublisher?.broadcastNotification(
        targetUserId,
        notification,
      );
      await this.workspaceEventPublisher?.broadcastInvitationCreated(
        workspaceId,
        invitation,
      );
      return Result.ok(invitation);
    }

    return Result.err(txResult.error);
  }

  async getWorkspaceInvitations(
    workspaceId: WorkspaceId,
    pagination: PaginationQuery,
  ): Promise<
    Result<
      PaginatedData<WorkspaceInvitationWithDetails>,
      DatabaseError | NotFoundError
    >
  > {
    const invitesResult =
      await this.workspacesRepository.getPendingInvitationsForWorkspace(
        workspaceId,
        pagination,
      );
    if (invitesResult.isErr()) {
      return Result.err(invitesResult.error);
    }

    const invites = invitesResult.value.payload;
    const userIds = [
      ...invites.map((i) => i.invitedUserId),
      ...invites.map((i) => i.invitedByUserId),
    ];

    const results = await Result.allAsync([
      this.usersService.getUsersByIds(userIds),
      this.workspacesRepository.getWorkspaceOnly(workspaceId),
    ]);

    if (results.isErr()) return Result.err(results.error);

    const [users, workspace] = results.value;
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
      pagination: invitesResult.value.pagination,
      payload,
    });
  }

  async acceptInvitation(invitationId: WorkspaceInvitationId, userId: UserId) {
    const invitationResult =
      await this.workspacesRepository.getInvitationById(invitationId);
    if (invitationResult.isErr()) {
      return Result.err(invitationResult.error);
    }

    const invitation = invitationResult.value;
    if (invitation.invitedUserId !== userId) {
      return Result.err(
        new DatabaseError({
          message: "You are not the recipient of this invitation",
        }),
      );
    }

    if (invitation.status !== "pending") {
      return Result.err(
        new DatabaseError({
          message: `Invitation is already ${invitation.status}`,
        }),
      );
    }

    const txResult = await this.dbClient.transaction(async (tx) => {
      const updateResult =
        await this.workspacesRepository.updateInvitationStatus(
          tx,
          invitationId,
          "accepted",
        );
      if (updateResult.isErr()) {
        tx.rollback();
        return Result.err(updateResult.error);
      }

      const memberResult =
        await this.workspacesRepository.createWorkspaceMember(tx, {
          workspaceId: invitation.workspaceId,
          userId,
          role: "member",
        });
      if (memberResult.isErr()) {
        tx.rollback();
        return Result.err(memberResult.error);
      }

      await this.workspacesRepository.incrementMembersCount(
        tx,
        invitation.workspaceId,
      );

      const workspaceResult = await this.workspacesRepository.getWorkspaceOnly(
        invitation.workspaceId,
      );
      if (workspaceResult.isErr()) {
        tx.rollback();
        return Result.err(workspaceResult.error);
      }

      const userResult = await this.usersService.getUserById(userId);
      const user = userResult.isOk() ? userResult.value : null;

      const memberDetail: WorkspaceMemberDetail = {
        id: `${invitation.workspaceId}_${userId}`,
        userId,
        name: user?.name ?? "Member",
        email: user?.email ?? "",
        avatarUrl: user?.image ?? null,
        role: "member",
        joinedAt: new Date(),
      };

      return Result.ok({
        workspace: workspaceResult.value,
        member: memberDetail,
        invitation,
      });
    });

    if (txResult.isOk()) {
      const { workspace, member, invitation: inv } = txResult.value;
      await this.workspaceEventPublisher?.broadcastMemberJoined(workspace.id, {
        invitationId: inv.id,
        member,
      });
      await this.cacheInvalidator?.invalidateUserPermissions(userId);
      return Result.ok(workspace);
    }

    return Result.err(txResult.error);
  }

  async declineInvitation(invitationId: WorkspaceInvitationId, userId: UserId) {
    const invitationResult =
      await this.workspacesRepository.getInvitationById(invitationId);
    if (invitationResult.isErr()) {
      return Result.err(invitationResult.error);
    }

    const invitation = invitationResult.value;
    if (invitation.invitedUserId !== userId) {
      return Result.err(
        new DatabaseError({
          message: "You are not the recipient of this invitation",
        }),
      );
    }

    if (invitation.status !== "pending") {
      return Result.err(
        new DatabaseError({
          message: `Invitation is already ${invitation.status}`,
        }),
      );
    }

    const txResult = await this.dbClient.transaction(async (tx) => {
      const updateResult =
        await this.workspacesRepository.updateInvitationStatus(
          tx,
          invitationId,
          "declined",
        );
      if (updateResult.isErr()) {
        tx.rollback();
        return Result.err(updateResult.error);
      }
      return Result.ok({ invitation });
    });

    if (txResult.isOk()) {
      const { invitation: inv } = txResult.value;
      await this.workspaceEventPublisher?.broadcastInvitationDeclined(
        inv.workspaceId,
        inv.id,
      );
      return Result.ok(true);
    }

    return Result.err(txResult.error);
  }

  async cancelInvitation(
    workspaceId: WorkspaceId,
    invitationId: WorkspaceInvitationId,
  ) {
    const txResult = await this.dbClient.transaction(async (tx) => {
      const updateResult =
        await this.workspacesRepository.updateInvitationStatus(
          tx,
          invitationId,
          "cancelled",
        );
      if (updateResult.isErr()) {
        tx.rollback();
        return Result.err(updateResult.error);
      }
      return Result.ok({ workspaceId, invitationId });
    });

    if (txResult.isOk()) {
      await this.workspaceEventPublisher?.broadcastInvitationCancelled(
        workspaceId,
        invitationId,
      );
      return Result.ok(true);
    }

    return Result.err(txResult.error);
  }

  async updateMemberRole(
    workspaceId: WorkspaceId,
    targetUserId: UserId,
    newRole: WorkspaceRole,
  ): Promise<Result<WorkspaceMemberDetail, DatabaseError | NotFoundError>> {
    const targetMember = await this.workspacesRepository.getMember(
      workspaceId,
      targetUserId,
    );
    if (targetMember.isErr()) {
      return Result.err(targetMember.error);
    }

    if (targetMember.value.role === "owner") {
      return Result.err(
        new DatabaseError({
          message: "The workspace owner's role cannot be modified",
        }),
      );
    }

    if (newRole === "owner") {
      return Result.err(
        new DatabaseError({
          message: "Cannot assign owner role through role update",
        }),
      );
    }

    const txResult = await this.dbClient.transaction(async (tx) => {
      const updatedRow = await this.workspacesRepository.updateMemberRole(
        tx,
        workspaceId,
        targetUserId,
        newRole,
      );
      if (updatedRow.isErr()) {
        tx.rollback();
        return Result.err(updatedRow.error);
      }

      const userResult = await this.usersService.getUserById(targetUserId);
      const user = userResult.isOk() ? userResult.value : null;

      const memberDetail: WorkspaceMemberDetail = {
        id: `${workspaceId}_${targetUserId}`,
        userId: targetUserId,
        name: user?.name ?? "Member",
        email: user?.email ?? "",
        avatarUrl: user?.image ?? null,
        role: newRole,
        joinedAt: updatedRow.value.createdAt,
      };

      return Result.ok(memberDetail);
    });

    if (txResult.isOk()) {
      await this.cacheInvalidator?.invalidateUserPermissions(targetUserId);
      return txResult;
    }

    return Result.err(txResult.error);
  }

  async removeMember(workspaceId: WorkspaceId, targetUserId: UserId) {
    const targetMember = await this.workspacesRepository.getMember(
      workspaceId,
      targetUserId,
    );
    if (targetMember.isErr()) {
      return Result.err(targetMember.error);
    }

    if (targetMember.value.role === "owner") {
      return Result.err(
        new DatabaseError({
          message: "The workspace owner cannot be removed",
        }),
      );
    }

    const txResult = await this.dbClient.transaction(async (tx) => {
      const removeResult = await this.workspacesRepository.removeMember(
        tx,
        workspaceId,
        targetUserId,
      );
      if (removeResult.isErr()) {
        tx.rollback();
        return Result.err(removeResult.error);
      }

      await this.workspacesRepository.decrementMembersCount(tx, workspaceId);

      return Result.ok(true);
    });

    if (txResult.isOk()) {
      await this.workspaceEventPublisher?.broadcastMemberRemoved(
        workspaceId,
        targetUserId,
      );
      await this.cacheInvalidator?.invalidateUserPermissions(targetUserId);
      return Result.ok(true);
    }

    return Result.err(txResult.error);
  }

  // --- Authorization Attribute Loaders ---

  async loadWorkspaceResourceData({
    workspaceId,
    userId,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<ResourceData<"workspace">, DatabaseError>> {
    const memberResult = await this.workspacesRepository.getMember(
      workspaceId,
      userId,
    );
    const userRole = memberResult.isOk() ? memberResult.value.role : null;
    return Result.ok({
      workspaceId,
      userRole,
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
    const [targetMemberRes, callerMemberRes] = await Promise.all([
      this.workspacesRepository.getMember(workspaceId, targetUserId),
      this.workspacesRepository.getMember(workspaceId, callerUserId),
    ]);

    if (targetMemberRes.isErr()) {
      if (targetMemberRes.error._tag === "NotFoundError") {
        return Result.ok(null);
      }
      return Result.err(targetMemberRes.error);
    }

    if (
      callerMemberRes.isErr() &&
      callerMemberRes.error._tag !== "NotFoundError"
    ) {
      return Result.err(callerMemberRes.error);
    }

    return Result.ok({
      workspaceId,
      targetUserId,
      targetRole: targetMemberRes.value.role,
      userRole: callerMemberRes.isOk() ? callerMemberRes.value.role : null,
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
    const invResult =
      await this.workspacesRepository.getInvitationById(invitationId);
    if (invResult.isErr()) {
      return invResult.error._tag === "NotFoundError"
        ? Result.ok(null)
        : Result.err(invResult.error);
    }
    const invitation = invResult.value;
    const memberResult = await this.workspacesRepository.getMember(
      invitation.workspaceId,
      callerUserId,
    );
    const userRole = memberResult.isOk() ? memberResult.value.role : null;

    return Result.ok({
      invitationId,
      workspaceId: invitation.workspaceId,
      invitedUserId: invitation.invitedUserId,
      invitedByUserId: invitation.invitedByUserId,
      userRole,
    });
  }

  async loadWorkspaceScopeData({
    workspaceId,
    userId,
  }: {
    workspaceId?: WorkspaceId;
    userId: UserId;
  }): Promise<Result<ScopeData<"workspaceMember"> | null, DatabaseError>> {
    if (!workspaceId) return Result.ok(null);

    const memberResult = await this.workspacesRepository.getMember(
      workspaceId,
      userId,
    );
    const userRole = memberResult.isOk() ? memberResult.value.role : null;

    return Result.ok({
      workspaceId,
      userRole,
    });
  }
}
