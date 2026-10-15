import type { UserId } from "@dotion/shared/users/types";
import type { AppDB, DBClient } from "../index";
import {
  workspaceInvitations,
  workspaceMembers,
  workspaces,
} from "../schema/workspaces";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { Result } from "better-result";
import {
  DatabaseError,
  NotFoundError,
  UniqueConstraintViolationError,
} from "../errors";
import type {
  CreateWorkspaceInput,
  CreateWorkspaceMemberInput,
  CreateWorkspaceInvitationInput,
  Workspace,
  WorkspaceId,
  WorkspaceInvitation,
  WorkspaceInvitationId,
  WorkspaceRole,
} from "@dotion/shared/workspaces/types";
import type {
  PaginationQuery,
  PaginatedData,
} from "@dotion/shared/pagination/types";

export interface WorkspaceMemberRow {
  workspaceId: WorkspaceId;
  userId: UserId;
  role: WorkspaceRole;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkspacesRepository {
  constructor(private readonly db: DBClient) {}

  async getAllWorkspaces({
    userId,
  }: {
    userId: UserId;
  }): Promise<Result<Workspace[], DatabaseError>> {
    try {
      const result = await this.db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          membersCount: workspaces.membersCount,
          createdAt: workspaces.createdAt,
          updatedAt: workspaces.updatedAt,
        })
        .from(workspaces)
        .innerJoin(
          workspaceMembers,
          eq(workspaces.id, workspaceMembers.workspaceId),
        )
        .where(eq(workspaceMembers.userId, userId));

      return Result.ok(result);
    } catch (e) {
      console.error("Error fetching workspaces:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to get workspaces" }),
      );
    }
  }

  async createWorkspace({
    input,
  }: {
    input: CreateWorkspaceInput;
  }): Promise<Result<Workspace, DatabaseError>> {
    return this.createWorkspaceTx({ tx: this.db, input });
  }

  async createWorkspaceTx({
    tx,
    input,
  }: {
    tx: AppDB;
    input: CreateWorkspaceInput;
  }): Promise<Result<Workspace, DatabaseError>> {
    try {
      const [data] = await tx
        .insert(workspaces)
        .values({
          ...input,
          membersCount: 1,
        })
        .returning({
          id: workspaces.id,
          name: workspaces.name,
          membersCount: workspaces.membersCount,
          createdAt: workspaces.createdAt,
          updatedAt: workspaces.updatedAt,
        });

      if (!data) {
        return Result.err(
          new DatabaseError({ message: "Failed to create workspace" }),
        );
      }

      return Result.ok(data);
    } catch (e) {
      console.error("Error creating workspace:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to create workspace" }),
      );
    }
  }

  async createWorkspaceMember({
    input,
  }: {
    input: CreateWorkspaceMemberInput;
  }): Promise<
    Result<WorkspaceMemberRow, DatabaseError | UniqueConstraintViolationError>
  > {
    return this.createWorkspaceMemberTx({ tx: this.db, input });
  }

  async createWorkspaceMemberTx({
    tx,
    input,
  }: {
    tx: AppDB;
    input: CreateWorkspaceMemberInput;
  }): Promise<
    Result<WorkspaceMemberRow, DatabaseError | UniqueConstraintViolationError>
  > {
    try {
      const [data] = await tx.insert(workspaceMembers).values(input).returning({
        workspaceId: workspaceMembers.workspaceId,
        userId: workspaceMembers.userId,
        role: workspaceMembers.role,
        createdAt: workspaceMembers.createdAt,
        updatedAt: workspaceMembers.updatedAt,
      });

      if (!data) {
        return Result.err(
          new DatabaseError({ message: "Failed to create workspace member" }),
        );
      }

      return Result.ok(data);
    } catch (e) {
      console.error("Error create workspace member", e);
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (
        errorMessage.includes("UNIQUE") ||
        errorMessage.includes("constraint")
      ) {
        return Result.err(
          new UniqueConstraintViolationError({
            message: "User is already a member of this workspace",
          }),
        );
      }

      return Result.err(
        new DatabaseError({ message: "Failed to create workspace member" }),
      );
    }
  }

  async getById({
    workspaceId,
    userId,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<Workspace, DatabaseError | NotFoundError>> {
    try {
      const [data] = await this.db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          membersCount: workspaces.membersCount,
          createdAt: workspaces.createdAt,
          updatedAt: workspaces.updatedAt,
        })
        .from(workspaces)
        .innerJoin(
          workspaceMembers,
          eq(workspaces.id, workspaceMembers.workspaceId),
        )
        .where(
          and(
            eq(workspaces.id, workspaceId),
            eq(workspaceMembers.userId, userId),
          ),
        );

      if (!data) {
        return Result.err(
          new NotFoundError({ message: "Workspace not found" }),
        );
      }

      return Result.ok(data);
    } catch (e) {
      console.error("Error fetching workspace by ID:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to get workspace" }),
      );
    }
  }

  async getWorkspaceOnly({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<Workspace, DatabaseError | NotFoundError>> {
    try {
      const [data] = await this.db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          membersCount: workspaces.membersCount,
          createdAt: workspaces.createdAt,
          updatedAt: workspaces.updatedAt,
        })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId));

      if (!data) {
        return Result.err(
          new NotFoundError({ message: "Workspace not found" }),
        );
      }

      return Result.ok(data);
    } catch (e) {
      console.error("Error fetching workspace:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to get workspace" }),
      );
    }
  }

  async getMemberUserIds({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<UserId[], DatabaseError>> {
    try {
      const rows = await this.db
        .select({ userId: workspaceMembers.userId })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId));

      return Result.ok(rows.map((r) => r.userId));
    } catch (e) {
      console.error("WorkspacesRepository.getMemberUserIds error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to get member user IDs" }),
      );
    }
  }

  async getPendingInvitedUserIds({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<UserId[], DatabaseError>> {
    try {
      const rows = await this.db
        .select({ userId: workspaceInvitations.invitedUserId })
        .from(workspaceInvitations)
        .where(
          and(
            eq(workspaceInvitations.workspaceId, workspaceId),
            eq(workspaceInvitations.status, "pending"),
          ),
        );

      return Result.ok(rows.map((r) => r.userId));
    } catch (e) {
      console.error("WorkspacesRepository.getPendingInvitedUserIds error:", e);
      return Result.err(
        new DatabaseError({
          message: "Failed to get pending invited user IDs",
        }),
      );
    }
  }

  async getPendingInvitationForUser({
    workspaceId,
    userId,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<WorkspaceInvitation | null, DatabaseError>> {
    try {
      const [row] = await this.db
        .select({
          id: workspaceInvitations.id,
          workspaceId: workspaceInvitations.workspaceId,
          invitedUserId: workspaceInvitations.invitedUserId,
          invitedByUserId: workspaceInvitations.invitedByUserId,
          status: workspaceInvitations.status,
          createdAt: workspaceInvitations.createdAt,
          updatedAt: workspaceInvitations.updatedAt,
        })
        .from(workspaceInvitations)
        .where(
          and(
            eq(workspaceInvitations.workspaceId, workspaceId),
            eq(workspaceInvitations.invitedUserId, userId),
            eq(workspaceInvitations.status, "pending"),
          ),
        );

      return Result.ok(row ?? null);
    } catch (e) {
      console.error(
        "WorkspacesRepository.getPendingInvitationForUser error:",
        e,
      );
      return Result.err(
        new DatabaseError({
          message: "Failed to check pending invitation for user",
        }),
      );
    }
  }

  async getMembers({
    workspaceId,
    pagination,
  }: {
    workspaceId: WorkspaceId;
    pagination: PaginationQuery;
  }): Promise<Result<PaginatedData<WorkspaceMemberRow>, DatabaseError>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;

      const countQuery = this.db
        .select({ total: count() })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId));

      const rowsQuery = this.db
        .select({
          workspaceId: workspaceMembers.workspaceId,
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
          createdAt: workspaceMembers.createdAt,
          updatedAt: workspaceMembers.updatedAt,
        })
        .from(workspaceMembers)
        .where(eq(workspaceMembers.workspaceId, workspaceId))
        .orderBy(desc(workspaceMembers.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const [[countResult], rows] = await Promise.all([countQuery, rowsQuery]);
      const total = Number(countResult?.total ?? 0);
      const hasMore = offset + rows.length < total;

      return Result.ok({
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          hasMore,
        },
        payload: rows,
      });
    } catch (e) {
      console.error("WorkspacesRepository.getMembers error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to get workspace members" }),
      );
    }
  }

  async getMember({
    workspaceId,
    userId,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<WorkspaceMemberRow, DatabaseError | NotFoundError>> {
    try {
      const [row] = await this.db
        .select({
          workspaceId: workspaceMembers.workspaceId,
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
          createdAt: workspaceMembers.createdAt,
          updatedAt: workspaceMembers.updatedAt,
        })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId),
          ),
        );

      if (!row) {
        return Result.err(
          new NotFoundError({ message: "Workspace member not found" }),
        );
      }

      return Result.ok(row);
    } catch (e) {
      console.error("WorkspacesRepository.getMember error:", e);
      return Result.err(new DatabaseError({ message: "Failed to get member" }));
    }
  }

  async isMember({
    workspaceId,
    userId,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<boolean, DatabaseError>> {
    try {
      const [row] = await this.db
        .select({ userId: workspaceMembers.userId })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId),
          ),
        );

      return Result.ok(Boolean(row));
    } catch (e) {
      console.error("WorkspacesRepository.isMember error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to check workspace membership" }),
      );
    }
  }

  async getWorkspaceOwnerUserId({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<UserId, DatabaseError | NotFoundError>> {
    try {
      const [row] = await this.db
        .select({
          userId: workspaceMembers.userId,
        })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.role, "owner"),
          ),
        )
        .limit(1);

      if (!row) {
        return Result.err(
          new NotFoundError({ message: "Workspace owner not found" }),
        );
      }

      return Result.ok(row.userId);
    } catch (e) {
      console.error("WorkspacesRepository.getWorkspaceOwnerUserId error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to get workspace owner" }),
      );
    }
  }

  async createInvitation({
    input,
  }: {
    input: CreateWorkspaceInvitationInput;
  }): Promise<
    Result<WorkspaceInvitation, DatabaseError | UniqueConstraintViolationError>
  > {
    return this.createInvitationTx({ tx: this.db, input });
  }

  async createInvitationTx({
    tx,
    input,
  }: {
    tx: AppDB;
    input: CreateWorkspaceInvitationInput;
  }): Promise<
    Result<WorkspaceInvitation, DatabaseError | UniqueConstraintViolationError>
  > {
    try {
      const [row] = await tx
        .insert(workspaceInvitations)
        .values(input)
        .returning({
          id: workspaceInvitations.id,
          workspaceId: workspaceInvitations.workspaceId,
          invitedUserId: workspaceInvitations.invitedUserId,
          invitedByUserId: workspaceInvitations.invitedByUserId,
          status: workspaceInvitations.status,
          createdAt: workspaceInvitations.createdAt,
          updatedAt: workspaceInvitations.updatedAt,
        });

      if (!row) {
        return Result.err(
          new DatabaseError({ message: "Failed to create invitation" }),
        );
      }

      return Result.ok(row);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      if (
        errorMessage.includes("UNIQUE") ||
        errorMessage.includes("constraint")
      ) {
        return Result.err(
          new UniqueConstraintViolationError({
            message: "A pending invitation already exists for this user",
          }),
        );
      }

      console.error("WorkspacesRepository.createInvitation error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to create invitation" }),
      );
    }
  }

  async getInvitationById({
    invitationId,
  }: {
    invitationId: WorkspaceInvitationId;
  }): Promise<Result<WorkspaceInvitation, DatabaseError | NotFoundError>> {
    try {
      const [row] = await this.db
        .select({
          id: workspaceInvitations.id,
          workspaceId: workspaceInvitations.workspaceId,
          invitedUserId: workspaceInvitations.invitedUserId,
          invitedByUserId: workspaceInvitations.invitedByUserId,
          status: workspaceInvitations.status,
          createdAt: workspaceInvitations.createdAt,
          updatedAt: workspaceInvitations.updatedAt,
        })
        .from(workspaceInvitations)
        .where(eq(workspaceInvitations.id, invitationId));

      if (!row) {
        return Result.err(
          new NotFoundError({ message: "Invitation not found" }),
        );
      }

      return Result.ok(row);
    } catch (e) {
      console.error("WorkspacesRepository.getInvitationById error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to get invitation" }),
      );
    }
  }

  async getPendingInvitationsForWorkspace({
    workspaceId,
    pagination,
  }: {
    workspaceId: WorkspaceId;
    pagination: PaginationQuery;
  }): Promise<Result<PaginatedData<WorkspaceInvitation>, DatabaseError>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit;
      const whereClause = and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.status, "pending"),
      );

      const countQuery = this.db
        .select({ total: count() })
        .from(workspaceInvitations)
        .where(whereClause);

      const rowsQuery = this.db
        .select({
          id: workspaceInvitations.id,
          workspaceId: workspaceInvitations.workspaceId,
          invitedUserId: workspaceInvitations.invitedUserId,
          invitedByUserId: workspaceInvitations.invitedByUserId,
          status: workspaceInvitations.status,
          createdAt: workspaceInvitations.createdAt,
          updatedAt: workspaceInvitations.updatedAt,
        })
        .from(workspaceInvitations)
        .where(whereClause)
        .orderBy(desc(workspaceInvitations.createdAt))
        .limit(pagination.limit)
        .offset(offset);

      const [[countResult], rows] = await Promise.all([countQuery, rowsQuery]);
      const total = Number(countResult?.total ?? 0);
      const hasMore = offset + rows.length < total;

      return Result.ok({
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          hasMore,
        },
        payload: rows,
      });
    } catch (e) {
      console.error(
        "WorkspacesRepository.getPendingInvitationsForWorkspace error:",
        e,
      );
      return Result.err(
        new DatabaseError({
          message: "Failed to get pending invitations for workspace",
        }),
      );
    }
  }

  async updateInvitationStatus({
    invitationId,
    status,
  }: {
    invitationId: WorkspaceInvitationId;
    status: "pending" | "accepted" | "declined" | "cancelled";
  }): Promise<Result<WorkspaceInvitation, DatabaseError | NotFoundError>> {
    return this.updateInvitationStatusTx({ tx: this.db, invitationId, status });
  }

  async updateInvitationStatusTx({
    tx,
    invitationId,
    status,
  }: {
    tx: AppDB;
    invitationId: WorkspaceInvitationId;
    status: "pending" | "accepted" | "declined" | "cancelled";
  }): Promise<Result<WorkspaceInvitation, DatabaseError | NotFoundError>> {
    try {
      const [updated] = await tx
        .update(workspaceInvitations)
        .set({ status })
        .where(eq(workspaceInvitations.id, invitationId))
        .returning({
          id: workspaceInvitations.id,
          workspaceId: workspaceInvitations.workspaceId,
          invitedUserId: workspaceInvitations.invitedUserId,
          invitedByUserId: workspaceInvitations.invitedByUserId,
          status: workspaceInvitations.status,
          createdAt: workspaceInvitations.createdAt,
          updatedAt: workspaceInvitations.updatedAt,
        });

      if (!updated) {
        return Result.err(
          new NotFoundError({ message: "Invitation not found" }),
        );
      }

      return Result.ok(updated);
    } catch (e) {
      console.error("WorkspacesRepository.updateInvitationStatus error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to update invitation status" }),
      );
    }
  }

  async updateMemberRole({
    workspaceId,
    userId,
    role,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
    role: WorkspaceRole;
  }): Promise<Result<WorkspaceMemberRow, DatabaseError | NotFoundError>> {
    try {
      const [updated] = await this.db
        .update(workspaceMembers)
        .set({ role })
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId),
          ),
        )
        .returning({
          workspaceId: workspaceMembers.workspaceId,
          userId: workspaceMembers.userId,
          role: workspaceMembers.role,
          createdAt: workspaceMembers.createdAt,
          updatedAt: workspaceMembers.updatedAt,
        });

      if (!updated) {
        return Result.err(
          new NotFoundError({ message: "Workspace member not found" }),
        );
      }

      return Result.ok(updated);
    } catch (e) {
      console.error("WorkspacesRepository.updateMemberRole error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to update member role" }),
      );
    }
  }

  async removeMember({
    workspaceId,
    userId,
  }: {
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<boolean, DatabaseError | NotFoundError>> {
    return this.removeMemberTx({ tx: this.db, workspaceId, userId });
  }

  async removeMemberTx({
    tx,
    workspaceId,
    userId,
  }: {
    tx: AppDB;
    workspaceId: WorkspaceId;
    userId: UserId;
  }): Promise<Result<boolean, DatabaseError | NotFoundError>> {
    try {
      const [deleted] = await tx
        .delete(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId),
          ),
        )
        .returning({ userId: workspaceMembers.userId });

      if (!deleted) {
        return Result.err(
          new NotFoundError({ message: "Workspace member not found" }),
        );
      }

      return Result.ok(true);
    } catch (e) {
      console.error("WorkspacesRepository.removeMember error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to remove workspace member" }),
      );
    }
  }

  async incrementMembersCount({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<boolean, DatabaseError>> {
    return this.incrementMembersCountTx({ tx: this.db, workspaceId });
  }

  async incrementMembersCountTx({
    tx,
    workspaceId,
  }: {
    tx: AppDB;
    workspaceId: WorkspaceId;
  }): Promise<Result<boolean, DatabaseError>> {
    try {
      await tx
        .update(workspaces)
        .set({ membersCount: sql`${workspaces.membersCount} + 1` })
        .where(eq(workspaces.id, workspaceId));

      return Result.ok(true);
    } catch (e) {
      console.error("WorkspacesRepository.incrementMembersCount error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to increment members count" }),
      );
    }
  }

  async decrementMembersCount({
    workspaceId,
  }: {
    workspaceId: WorkspaceId;
  }): Promise<Result<boolean, DatabaseError>> {
    return this.decrementMembersCountTx({ tx: this.db, workspaceId });
  }

  async decrementMembersCountTx({
    tx,
    workspaceId,
  }: {
    tx: AppDB;
    workspaceId: WorkspaceId;
  }): Promise<Result<boolean, DatabaseError>> {
    try {
      await tx
        .update(workspaces)
        .set({ membersCount: sql`GREATEST(0, ${workspaces.membersCount} - 1)` })
        .where(eq(workspaces.id, workspaceId));

      return Result.ok(true);
    } catch (e) {
      console.error("WorkspacesRepository.decrementMembersCount error:", e);
      return Result.err(
        new DatabaseError({ message: "Failed to decrement members count" }),
      );
    }
  }
}
