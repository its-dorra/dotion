import { Result } from "better-result";
import { DatabaseError } from "@dotion/db";
import type {
  ResourceType,
  ResourceInput,
  ResourceData,
  ScopeData,
  ScopeInput,
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
    input,
    user,
  }: {
    resource: R;
    input: ResourceInput<R>;
    user: User;
  }): Promise<Result<ResourceData<R> | null, DatabaseError>> {
    switch (resource) {
      case "workspace": {
        const { workspaceId } = input as ResourceInput<"workspace">;
        return this.services.workspaces.loadWorkspaceResourceData({
          workspaceId,
          userId: user.id,
        }) as Promise<Result<ResourceData<R> | null, DatabaseError>>;
      }

      case "workspaceMember": {
        const { workspaceId, memberUserId } =
          input as ResourceInput<"workspaceMember">;
        return this.services.workspaces.loadWorkspaceMemberResourceData({
          workspaceId,
          targetUserId: memberUserId,
          callerUserId: user.id,
        }) as Promise<Result<ResourceData<R> | null, DatabaseError>>;
      }

      case "workspaceInvitation": {
        const { invitationId } = input as ResourceInput<"workspaceInvitation">;
        return this.services.workspaces.loadWorkspaceInvitationResourceData({
          invitationId,
          callerUserId: user.id,
        }) as Promise<Result<ResourceData<R> | null, DatabaseError>>;
      }

      case "page": {
        const { pageId } = input as ResourceInput<"page">;
        return this.services.pages.loadPageResourceData({
          pageId,
          userId: user.id,
        }) as Promise<Result<ResourceData<R> | null, DatabaseError>>;
      }

      case "pagePermission": {
        const { pageId, targetUserId } =
          input as ResourceInput<"pagePermission">;
        return this.services.pages.loadPagePermissionResourceData({
          pageId,
          targetUserId,
          callerUserId: user.id,
        }) as Promise<Result<ResourceData<R> | null, DatabaseError>>;
      }

      case "comment": {
        const { commentId } = input as ResourceInput<"comment">;
        return this.services.comments.loadCommentResourceData({
          commentId,
          userId: user.id,
        }) as Promise<Result<ResourceData<R> | null, DatabaseError>>;
      }

      case "user": {
        return this.services.users.loadUserResourceData({
          input: input as ResourceInput<"user">,
        }) as Promise<Result<ResourceData<R> | null, DatabaseError>>;
      }

      default:
        return Result.ok(null);
    }
  }

  async loadScopeData<R extends ResourceType>({
    resource,
    scopeInput,
    user,
  }: {
    resource: R;
    scopeInput?: ScopeInput<R>;
    user: User;
  }): Promise<Result<ScopeData<R> | null, DatabaseError>> {
    switch (resource) {
      case "workspace": {
        const data: ScopeData<"workspace"> = {};
        return Result.ok(data as ScopeData<R>);
      }

      case "workspaceMember": {
        const wsId = (scopeInput as ScopeInput<"workspaceMember">)?.workspaceId;
        return this.services.workspaces.loadWorkspaceScopeData({
          workspaceId: wsId,
          userId: user.id,
        }) as Promise<Result<ScopeData<R> | null, DatabaseError>>;
      }

      case "workspaceInvitation": {
        const wsId = (scopeInput as ScopeInput<"workspaceInvitation">)
          ?.workspaceId;
        return this.services.workspaces.loadWorkspaceScopeData({
          workspaceId: wsId,
          userId: user.id,
        }) as Promise<Result<ScopeData<R> | null, DatabaseError>>;
      }

      case "page": {
        const wsId = (scopeInput as ScopeInput<"page">)?.workspaceId;
        return this.services.pages.loadPageScopeData({
          workspaceId: wsId,
          userId: user.id,
        }) as Promise<Result<ScopeData<R> | null, DatabaseError>>;
      }

      case "pagePermission": {
        const pId = (scopeInput as ScopeInput<"pagePermission">)?.pageId;
        return this.services.pages.loadPagePermissionScopeData({
          pageId: pId,
          userId: user.id,
        }) as Promise<Result<ScopeData<R> | null, DatabaseError>>;
      }

      case "comment": {
        const pId = (scopeInput as ScopeInput<"comment">)?.pageId;
        return this.services.comments.loadCommentScopeData({
          pageId: pId,
          userId: user.id,
        }) as Promise<Result<ScopeData<R> | null, DatabaseError>>;
      }

      case "user": {
        const data: ScopeData<"user"> = {};
        return Result.ok(data as ScopeData<R>);
      }

      default:
        return Result.ok(null);
    }
  }
}
