import { Result } from "better-result";
import { ForbiddenError } from "@dotion/shared/authorization/errors";
import { DatabaseError } from "@dotion/db";
import { deny, type Decision } from "@dotion/shared/authorization/decisions";
import type {
  ResourceType,
  ResourceAction,
  ResourceData,
  ResourceInput,
  ScopeData,
  ScopeInput,
  CollectionLevelAction,
  CheckPermissionQuery,
} from "@dotion/shared/authorization/types";
import { resourceSchemas } from "@dotion/shared/authorization/schema";
import type { User } from "@dotion/auth";
import { createDefaultAuthContext, type AuthorizationContext } from "./context";
import { AttributeLoader, type DomainServices } from "./loader";
import { MemoryAuthorizationCache, type AuthorizationCache } from "./cache";
import { PolicyEngine, type AuthorizeEngineParams } from "./engine";
import { workspacePolicy } from "./policies/workspace.policy";
import { workspaceMemberPolicy } from "./policies/workspace-member.policy";
import { workspaceInvitationPolicy } from "./policies/workspace-invitation.policy";
import { pagePolicy } from "./policies/page.policy";
import { pagePermissionPolicy } from "./policies/page-permission.policy";
import { commentPolicy } from "./policies/comment.policy";
import { userPolicy } from "./policies/user.policy";

import { ValidationError } from "@dotion/shared/authorization/errors";
export type { ValidationError };

export type AuthorizeParams<
  R extends ResourceType,
  A extends ResourceAction<R>,
> =
  A extends CollectionLevelAction<R>
    ? {
        user: User;
        resource: R;
        action: A;
        scope?: ScopeInput<R>;
        context?: Partial<AuthorizationContext>;
      }
    : {
        user: User;
        resource:
          | { type: R; id: ResourceInput<R> }
          | { type: R; data: ResourceData<R> };
        action: A;
        context?: Partial<AuthorizationContext>;
      };

export class AuthorizationService {
  private readonly engine: PolicyEngine;
  private readonly cache: AuthorizationCache;
  private readonly loader: AttributeLoader;

  constructor(
    services: DomainServices,
    cache?: AuthorizationCache,
    engine?: PolicyEngine,
  ) {
    this.cache = cache ?? new MemoryAuthorizationCache();
    this.loader = new AttributeLoader(services);
    if (engine) {
      this.engine = engine;
    } else {
      this.engine = new PolicyEngine()
        .register(workspacePolicy)
        .register(workspaceMemberPolicy)
        .register(workspaceInvitationPolicy)
        .register(pagePolicy)
        .register(pagePermissionPolicy)
        .register(commentPolicy)
        .register(userPolicy);
    }
  }

  async loadResourceData<R extends ResourceType>(
    resource: R,
    input: ResourceInput<R>,
    user: User,
  ): Promise<Result<ResourceData<R> | null, DatabaseError>> {
    return this.loader.loadResourceData(resource, input, user);
  }

  async loadScopeData<R extends ResourceType>(
    resource: R,
    scopeInput: ScopeInput<R> | undefined,
    user: User,
  ): Promise<Result<ScopeData<R> | null, DatabaseError>> {
    return this.loader.loadScopeData(resource, scopeInput, user);
  }

  evaluate<R extends ResourceType, A extends ResourceAction<R>>(
    params: AuthorizeEngineParams<R, A>,
  ): Decision {
    return this.engine.evaluate(params);
  }

  async authorize<R extends ResourceType, A extends ResourceAction<R>>(
    params: AuthorizeParams<R, A>,
  ): Promise<Result<Decision, DatabaseError>> {
    const context = createDefaultAuthContext(params.context);

    const cacheKey = this.computeCacheKey(params);
    if (cacheKey) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return Result.ok(cached);
      }
    }

    const resourceType: ResourceType =
      typeof params.resource === "string"
        ? (params.resource as ResourceType)
        : (params.resource.type as ResourceType);

    return Result.gen(async function* (this: AuthorizationService) {
      let decision: Decision;

      if (this.engine.isCollectionAction(resourceType, params.action)) {
        const scopeInput = "scope" in params ? params.scope : undefined;
        const scopeData = yield* Result.await(
          this.loader.loadScopeData(resourceType as R, scopeInput, params.user),
        );

        decision = this.engine.evaluate({
          user: params.user,
          resource: resourceType as R,
          action: params.action,
          scope: scopeData ?? undefined,
          context,
        } as AuthorizeEngineParams<R, A>);
      } else {
        const resWrapper = (
          params as {
            resource:
              | { type: R; id: ResourceInput<R> }
              | { type: R; data: ResourceData<R> };
          }
        ).resource;

        let resourceData: ResourceData<R> | null = null;

        if ("data" in resWrapper) {
          resourceData = resWrapper.data;
        } else {
          resourceData = yield* Result.await(
            this.loader.loadResourceData(
              resWrapper.type,
              resWrapper.id,
              params.user,
            ),
          );
        }

        if (!resourceData) {
          decision = deny("Target resource not found for authorization check");
        } else {
          decision = this.engine.evaluate({
            user: params.user,
            resource: { type: resWrapper.type, data: resourceData },
            action: params.action,
            context,
          } as AuthorizeEngineParams<R, A>);
        }
      }

      if (cacheKey && decision.type === "ALLOW") {
        await this.cache.set(cacheKey, decision, 60);
      }

      return Result.ok(decision);
    }, this);
  }

  async enforce<R extends ResourceType, A extends ResourceAction<R>>(
    params: AuthorizeParams<R, A>,
  ): Promise<Result<true, ForbiddenError>> {
    return this.authorize(params).then(
      Result.match({
        ok: (decision) =>
          decision.type === "ALLOW"
            ? Result.ok(true as const)
            : Result.err(
                new ForbiddenError({
                  message: decision.reason ?? "Forbidden: Access denied",
                  reason: decision.reason,
                }),
              ),
        err: () =>
          Result.err(
            new ForbiddenError({
              message: "Authorization failed",
              reason: "Unable to evaluate authorization policy",
            }),
          ),
      }),
    );
  }

  private computeCacheKey<R extends ResourceType, A extends ResourceAction<R>>(
    params: AuthorizeParams<R, A>,
  ): string | null {
    const { user, action } = params;

    if (typeof params.resource === "string") {
      const scope = "scope" in params ? params.scope : undefined;
      const scopeKey = scope ? JSON.stringify(scope) : "root";
      return `authz:${user.id}:${params.resource}:${String(action)}:${scopeKey}`;
    }

    const res = params.resource;
    if ("id" in res) {
      return `authz:${user.id}:${res.type}:${String(action)}:${JSON.stringify(res.id)}`;
    }

    return null;
  }

  async invalidateUserPermissions(
    userId: string,
    resourceType?: ResourceType,
    id?: string,
  ): Promise<void> {
    const prefix = resourceType
      ? `authz:${userId}:${resourceType}:`
      : `authz:${userId}:`;

    await this.cache.invalidatePrefix(prefix);

    if (resourceType === "page" && id) {
      const pageActions = [
        "view",
        "update",
        "delete",
        "restore",
        "move",
        "managePermissions",
        "share",
      ];
      await Promise.all(
        pageActions.map((action) =>
          this.cache.delete(
            `authz:${userId}:page:${action}:${JSON.stringify({ pageId: id })}`,
          ),
        ),
      );
    }
  }

  async checkPermission(
    user: User,
    query: CheckPermissionQuery,
  ): Promise<Result<Decision, DatabaseError | ValidationError>> {
    const isCollection = this.isCollectionAction(query.resource, query.action);

    if (isCollection) {
      const scope = this.extractScope(query);
      return this.authorize({
        user,
        resource: query.resource,
        action: query.action as any,
        scope: scope as any,
      });
    }

    const id = this.extractId(query);
    if (!id) {
      return Result.err(
        new ValidationError({
          message: "Missing required resource identifier for instance action",
        }),
      );
    }

    return this.authorize({
      user,
      resource: {
        type: query.resource,
        id: id as any,
      },
      action: query.action as any,
    });
  }

  private isCollectionAction(resource: ResourceType, action: string): boolean {
    const schema = resourceSchemas[resource];
    return schema.collectionActions.safeParse(action).success;
  }

  private extractScope(
    query: CheckPermissionQuery,
  ): Record<string, any> | undefined {
    switch (query.resource) {
      case "workspaceMember":
      case "workspaceInvitation":
      case "page":
        return query.workspaceId
          ? { workspaceId: query.workspaceId }
          : undefined;
      case "pagePermission":
      case "comment":
        return query.pageId ? { pageId: query.pageId } : undefined;
      default:
        return undefined;
    }
  }

  private extractId(query: CheckPermissionQuery): Record<string, any> | null {
    switch (query.resource) {
      case "workspace":
        return query.workspaceId ? { workspaceId: query.workspaceId } : null;
      case "workspaceMember":
        return query.workspaceId && query.memberUserId
          ? { workspaceId: query.workspaceId, memberUserId: query.memberUserId }
          : null;
      case "workspaceInvitation":
        return query.invitationId ? { invitationId: query.invitationId } : null;
      case "page":
        return query.pageId ? { pageId: query.pageId } : null;
      case "pagePermission":
        return query.pageId && query.targetUserId
          ? { pageId: query.pageId, targetUserId: query.targetUserId }
          : null;
      case "comment":
        return query.commentId ? { commentId: query.commentId } : null;
      case "user":
        return query.userId ? { userId: query.userId } : null;
      default:
        return null;
    }
  }
}
