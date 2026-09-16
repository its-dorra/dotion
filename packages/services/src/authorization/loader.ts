import { Result } from "better-result";
import { DatabaseError } from "@dotion/db";
import type {
  ResourceType,
  ResourceTarget,
  ResourceAttributes,
  ContainerAttributes,
  ResourceContainer,
} from "@dotion/shared/authorization/types";
import type { User } from "@dotion/auth";
import type { WorkspacesService } from "#/workspaces.service";
import type { PagesService } from "#/pages.service";
import type { CommentsService } from "#/comments.service";
import type { UsersService } from "#/users.service";

export interface DomainServices {
  workspaces: WorkspacesService;
  pages: PagesService;
  comments: CommentsService;
  users: UsersService;
}

export class AttributeLoader {
  constructor(private readonly services: DomainServices) {}

  async loadResourceData<R extends ResourceType>({
    resource,
    target,
    user,
  }: {
    resource: R;
    target: ResourceTarget<R>;
    user: User;
  }): Promise<Result<ResourceAttributes<R> | null, DatabaseError>> {
    switch (resource) {
      case "workspace": {
        const { workspaceId } = target as ResourceTarget<"workspace">;
        return this.services.workspaces.loadWorkspaceResourceData({
          workspaceId,
          userId: user.id,
        }) as Promise<Result<ResourceAttributes<R> | null, DatabaseError>>;
      }

      case "workspaceMember": {
        const { workspaceId, memberUserId } =
          target as ResourceTarget<"workspaceMember">;
        return this.services.workspaces.loadWorkspaceMemberResourceData({
          workspaceId,
          targetUserId: memberUserId,
          callerUserId: user.id,
        }) as Promise<Result<ResourceAttributes<R> | null, DatabaseError>>;
      }

      case "workspaceInvitation": {
        const { invitationId } =
          target as ResourceTarget<"workspaceInvitation">;
        return this.services.workspaces.loadWorkspaceInvitationResourceData({
          invitationId,
          callerUserId: user.id,
        }) as Promise<Result<ResourceAttributes<R> | null, DatabaseError>>;
      }

      case "page": {
        const { pageId } = target as ResourceTarget<"page">;
        return this.services.pages.loadPageResourceData({
          pageId,
          userId: user.id,
        }) as Promise<Result<ResourceAttributes<R> | null, DatabaseError>>;
      }

      case "pagePermission": {
        const { pageId, targetUserId } =
          target as ResourceTarget<"pagePermission">;
        return this.services.pages.loadPagePermissionResourceData({
          pageId,
          targetUserId,
          callerUserId: user.id,
        }) as Promise<Result<ResourceAttributes<R> | null, DatabaseError>>;
      }

      case "comment": {
        const { commentId } = target as ResourceTarget<"comment">;
        return this.services.comments.loadCommentResourceData({
          commentId,
          userId: user.id,
        }) as Promise<Result<ResourceAttributes<R> | null, DatabaseError>>;
      }

      case "user": {
        return this.services.users.loadUserResourceData({
          input: target as ResourceTarget<"user">,
        }) as Promise<Result<ResourceAttributes<R> | null, DatabaseError>>;
      }

      default:
        return Result.ok(null);
    }
  }

  async loadScopeData<R extends ResourceType>({
    resource,
    container,
    user,
  }: {
    resource: R;
    container?: ResourceContainer<R>;
    user: User;
  }): Promise<Result<ContainerAttributes<R> | null, DatabaseError>> {
    switch (resource) {
      case "workspace": {
        const data: ContainerAttributes<"workspace"> = {};
        return Result.ok(data as ContainerAttributes<R>);
      }

      case "workspaceMember": {
        const wsId = (container as ResourceContainer<"workspaceMember">)
          ?.workspaceId;
        if (!wsId) return Result.ok(null);
        return this.services.workspaces.loadWorkspaceScopeData({
          workspaceId: wsId,
          userId: user.id,
        }) as Promise<Result<ContainerAttributes<R> | null, DatabaseError>>;
      }

      case "workspaceInvitation": {
        const wsId = (container as ResourceContainer<"workspaceInvitation">)
          ?.workspaceId;
        if (!wsId) return Result.ok(null);
        return this.services.workspaces.loadWorkspaceScopeData({
          workspaceId: wsId,
          userId: user.id,
        }) as Promise<Result<ContainerAttributes<R> | null, DatabaseError>>;
      }

      case "page": {
        const wsId = (container as ResourceContainer<"page">)?.workspaceId;
        if (!wsId) return Result.ok(null);
        return this.services.pages.loadPageScopeData({
          workspaceId: wsId,
          userId: user.id,
        }) as Promise<Result<ContainerAttributes<R> | null, DatabaseError>>;
      }

      case "pagePermission": {
        const pId = (container as ResourceContainer<"pagePermission">)?.pageId;
        if (!pId) return Result.ok(null);
        return this.services.pages.loadPagePermissionScopeData({
          pageId: pId,
          userId: user.id,
        }) as Promise<Result<ContainerAttributes<R> | null, DatabaseError>>;
      }

      case "comment": {
        const pId = (container as ResourceContainer<"comment">)?.pageId;
        if (!pId) return Result.ok(null);
        return this.services.comments.loadCommentScopeData({
          pageId: pId,
          userId: user.id,
        }) as Promise<Result<ContainerAttributes<R> | null, DatabaseError>>;
      }

      case "user": {
        const data: ContainerAttributes<"user"> = {};
        return Result.ok(data as ContainerAttributes<R>);
      }

      default:
        return Result.ok(null);
    }
  }
}
