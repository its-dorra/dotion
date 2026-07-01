import { Result } from "better-result";
import { ValidationError, AppError } from "@/lib/errors";
import {
  WorkspaceNotFoundError,
  InvitationNotFoundError,
  MemberAlreadyExistsError,
  CannotRemoveOwnerError,
  InsufficientWorkspacePermissionError,
} from "./errors";
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  CreateWorkspaceInput,
  InviteMemberInput,
  AcceptInvitationInput,
  UpdateMemberRoleInput,
  RemoveMemberInput,
  UpdateWorkspaceInput,
} from "./types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Mock data store (module-level, simulates a backend for this session)
// ---------------------------------------------------------------------------

let mockWorkspaces: Workspace[] = [
  {
    id: "ws_1",
    name: "Acme Inc",
    icon: "🏢",
    memberCount: 4,
    createdAt: "2025-11-02T10:00:00.000Z",
    currentUserRole: "owner",
  },
  {
    id: "ws_2",
    name: "Side Project",
    icon: "🚀",
    memberCount: 1,
    createdAt: "2026-01-15T10:00:00.000Z",
    currentUserRole: "owner",
  },
];

let mockMembers: Record<string, WorkspaceMember[]> = {
  ws_1: [
    {
      id: "mem_1",
      userId: "user_1",
      name: "Sam",
      email: "sam@example.com",
      role: "owner",
      joinedAt: "2025-11-02T10:00:00.000Z",
    },
    {
      id: "mem_2",
      userId: "user_2",
      name: "Jordan Lee",
      email: "jordan@example.com",
      role: "admin",
      joinedAt: "2025-11-05T10:00:00.000Z",
    },
    {
      id: "mem_3",
      userId: "user_3",
      name: "Priya Shah",
      email: "priya@example.com",
      role: "member",
      joinedAt: "2025-12-01T10:00:00.000Z",
    },
    {
      id: "mem_4",
      userId: "user_4",
      name: "Mateo Garcia",
      email: "mateo@example.com",
      role: "member",
      joinedAt: "2026-01-10T10:00:00.000Z",
    },
  ],
  ws_2: [
    {
      id: "mem_5",
      userId: "user_1",
      name: "Sam",
      email: "sam@example.com",
      role: "owner",
      joinedAt: "2026-01-15T10:00:00.000Z",
    },
  ],
};

let mockInvitations: WorkspaceInvitation[] = [
  {
    id: "inv_1",
    workspaceId: "ws_3",
    workspaceName: "Design Collective",
    workspaceIcon: "🎨",
    invitedEmail: "sam@example.com",
    invitedByName: "Riley Chen",
    role: "member",
    status: "pending",
    createdAt: "2026-06-20T09:00:00.000Z",
  },
];

export class WorkspacesApi {
  async getWorkspaces(): Promise<Result<Workspace[], AppError>> {
    await delay(500);
    return Result.ok([...mockWorkspaces]);
  }

  async getWorkspace(
    workspaceId: string,
  ): Promise<Result<Workspace, WorkspaceNotFoundError>> {
    await delay(350);
    const workspace = mockWorkspaces.find((w) => w.id === workspaceId);
    if (!workspace) {
      return Result.err(
        new WorkspaceNotFoundError({
          message: `Workspace "${workspaceId}" was not found.`,
          workspaceId,
        }),
      );
    }
    return Result.ok(workspace);
  }

  async createWorkspace(
    input: CreateWorkspaceInput,
  ): Promise<Result<Workspace, ValidationError>> {
    await delay(600);

    if (!input.name.trim()) {
      return Result.err(
        new ValidationError({
          message: "Workspace name cannot be empty.",
          field: "name",
        }),
      );
    }

    const workspace: Workspace = {
      id: generateId("ws"),
      name: input.name.trim(),
      icon: input.icon ?? "📄",
      memberCount: 1,
      createdAt: new Date().toISOString(),
      currentUserRole: "owner",
    };

    mockWorkspaces = [...mockWorkspaces, workspace];
    mockMembers[workspace.id] = [
      {
        id: generateId("mem"),
        userId: "user_1",
        name: "Sam",
        email: "sam@example.com",
        role: "owner",
        joinedAt: workspace.createdAt,
      },
    ];

    return Result.ok(workspace);
  }

  async updateWorkspace(
    input: UpdateWorkspaceInput,
  ): Promise<Result<Workspace, WorkspaceNotFoundError | ValidationError>> {
    await delay(450);

    const workspace = mockWorkspaces.find(
      (w) => w.id === input.workspaceId,
    );
    if (!workspace) {
      return Result.err(
        new WorkspaceNotFoundError({
          message: `Workspace "${input.workspaceId}" was not found.`,
          workspaceId: input.workspaceId,
        }),
      );
    }

    if (input.name !== undefined && !input.name.trim()) {
      return Result.err(
        new ValidationError({
          message: "Workspace name cannot be empty.",
          field: "name",
        }),
      );
    }

    const updated: Workspace = {
      ...workspace,
      name: input.name?.trim() ?? workspace.name,
      icon: input.icon ?? workspace.icon,
    };

    mockWorkspaces = mockWorkspaces.map((w) =>
      w.id === updated.id ? updated : w,
    );

    return Result.ok(updated);
  }

  async getMembers(
    workspaceId: string,
  ): Promise<Result<WorkspaceMember[], WorkspaceNotFoundError>> {
    await delay(400);

    if (!mockWorkspaces.some((w) => w.id === workspaceId)) {
      return Result.err(
        new WorkspaceNotFoundError({
          message: `Workspace "${workspaceId}" was not found.`,
          workspaceId,
        }),
      );
    }

    return Result.ok([...(mockMembers[workspaceId] ?? [])]);
  }

  async inviteMember(
    input: InviteMemberInput,
  ): Promise<
    Result<
      WorkspaceInvitation,
      | ValidationError
      | MemberAlreadyExistsError
      | WorkspaceNotFoundError
      | InsufficientWorkspacePermissionError
    >
  > {
    await delay(550);

    if (input.actingUserRole !== "owner" && input.actingUserRole !== "admin") {
      return Result.err(
        new InsufficientWorkspacePermissionError({
          message: "Only workspace owners and admins can invite members.",
          requiredRole: "admin",
        }),
      );
    }

    const workspace = mockWorkspaces.find(
      (w) => w.id === input.workspaceId,
    );
    if (!workspace) {
      return Result.err(
        new WorkspaceNotFoundError({
          message: `Workspace "${input.workspaceId}" was not found.`,
          workspaceId: input.workspaceId,
        }),
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(input.email)) {
      return Result.err(
        new ValidationError({
          message: "Enter a valid email address.",
          field: "email",
        }),
      );
    }

    const existingMember = mockMembers[input.workspaceId]?.find(
      (m) => m.email.toLowerCase() === input.email.toLowerCase(),
    );
    if (existingMember) {
      return Result.err(
        new MemberAlreadyExistsError({
          message: `${input.email} is already a member of this workspace.`,
          email: input.email,
        }),
      );
    }

    const invitation: WorkspaceInvitation = {
      id: generateId("inv"),
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceIcon: workspace.icon,
      invitedEmail: input.email,
      invitedByName: "Sam",
      role: input.role,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    mockInvitations = [...mockInvitations, invitation];

    return Result.ok(invitation);
  }

  async getPendingInvitations(): Promise<
    Result<WorkspaceInvitation[], AppError>
  > {
    await delay(350);
    return Result.ok(
      mockInvitations.filter((inv) => inv.status === "pending"),
    );
  }

  async acceptInvitation(
    input: AcceptInvitationInput,
  ): Promise<Result<Workspace, InvitationNotFoundError>> {
    await delay(500);

    const invitation = mockInvitations.find(
      (inv) => inv.id === input.invitationId,
    );
    if (!invitation) {
      return Result.err(
        new InvitationNotFoundError({
          message: "This invitation no longer exists.",
          invitationId: input.invitationId,
        }),
      );
    }

    mockInvitations = mockInvitations.map((inv) =>
      inv.id === invitation.id ? { ...inv, status: "accepted" as const } : inv,
    );

    const newWorkspace: Workspace = {
      id: invitation.workspaceId,
      name: invitation.workspaceName,
      icon: invitation.workspaceIcon,
      memberCount: 1,
      createdAt: new Date().toISOString(),
      currentUserRole: invitation.role,
    };

    mockWorkspaces = [...mockWorkspaces, newWorkspace];

    return Result.ok(newWorkspace);
  }

  async declineInvitation(
    input: AcceptInvitationInput,
  ): Promise<Result<true, InvitationNotFoundError>> {
    await delay(400);

    const invitation = mockInvitations.find(
      (inv) => inv.id === input.invitationId,
    );
    if (!invitation) {
      return Result.err(
        new InvitationNotFoundError({
          message: "This invitation no longer exists.",
          invitationId: input.invitationId,
        }),
      );
    }

    mockInvitations = mockInvitations.map((inv) =>
      inv.id === invitation.id ? { ...inv, status: "declined" as const } : inv,
    );

    return Result.ok(true);
  }

  async updateMemberRole(
    input: UpdateMemberRoleInput,
  ): Promise<
    Result<
      WorkspaceMember,
      WorkspaceNotFoundError | InsufficientWorkspacePermissionError
    >
  > {
    await delay(450);

    if (input.actingUserRole !== "owner" && input.actingUserRole !== "admin") {
      return Result.err(
        new InsufficientWorkspacePermissionError({
          message: "Only workspace owners and admins can change member roles.",
          requiredRole: "admin",
        }),
      );
    }

    const members = mockMembers[input.workspaceId];
    if (!members) {
      return Result.err(
        new WorkspaceNotFoundError({
          message: `Workspace "${input.workspaceId}" was not found.`,
          workspaceId: input.workspaceId,
        }),
      );
    }

    const member = members.find((m) => m.id === input.memberId);
    if (!member) {
      return Result.err(
        new WorkspaceNotFoundError({
          message: `Member "${input.memberId}" was not found.`,
          workspaceId: input.workspaceId,
        }),
      );
    }

    if (member.role === "owner") {
      return Result.err(
        new InsufficientWorkspacePermissionError({
          message: "The workspace owner's role cannot be changed.",
          requiredRole: "owner",
        }),
      );
    }

    const updatedMember: WorkspaceMember = { ...member, role: input.role };
    mockMembers[input.workspaceId] = members.map((m) =>
      m.id === updatedMember.id ? updatedMember : m,
    );

    return Result.ok(updatedMember);
  }

  async removeMember(
    input: RemoveMemberInput,
  ): Promise<
    Result<
      true,
      | WorkspaceNotFoundError
      | CannotRemoveOwnerError
      | InsufficientWorkspacePermissionError
    >
  > {
    await delay(450);

    if (input.actingUserRole !== "owner" && input.actingUserRole !== "admin") {
      return Result.err(
        new InsufficientWorkspacePermissionError({
          message: "Only workspace owners and admins can remove members.",
          requiredRole: "admin",
        }),
      );
    }

    const members = mockMembers[input.workspaceId];
    if (!members) {
      return Result.err(
        new WorkspaceNotFoundError({
          message: `Workspace "${input.workspaceId}" was not found.`,
          workspaceId: input.workspaceId,
        }),
      );
    }

    const member = members.find((m) => m.id === input.memberId);
    if (member?.role === "owner") {
      return Result.err(
        new CannotRemoveOwnerError({
          message: "The workspace owner cannot be removed.",
        }),
      );
    }

    mockMembers[input.workspaceId] = members.filter(
      (m) => m.id !== input.memberId,
    );

    return Result.ok(true);
  }
}

export const workspacesApi = new WorkspacesApi();
