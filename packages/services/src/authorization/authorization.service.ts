import { Result } from "better-result";
import { DatabaseError } from "@dotion/db";
import { deny, type Decision } from "@dotion/shared/authorization/decisions";
import type {
  ResourceType,
  ResourceAction,
  ResourceAttributes,
  ResourceTarget,
  ResourceContainer,
  CollectionLevelAction,
  CheckPermissionQuery,
} from "@dotion/shared/authorization/types";
import { resourceSchemas } from "@dotion/shared/authorization/schema";
import type { User } from "@dotion/auth";
import { AttributeLoader, type DomainServices } from "./loader";
import type { AuthorizationCache } from "./cache";
import { PolicyEngine } from "./engine";
import type { AuthorizeEngineParams } from "@dotion/shared/authorization/policy";
import { ValidationError } from "@dotion/shared/authorization/errors";
import { workspacePolicy } from "./policies/workspace.policy";
import { workspaceMemberPolicy } from "./policies/workspace-member.policy";
import { workspaceInvitationPolicy } from "./policies/workspace-invitation.policy";
import { pagePolicy } from "./policies/page.policy";
import { pagePermissionPolicy } from "./policies/page-permission.policy";
import { commentPolicy } from "./policies/comment.policy";
import { userPolicy } from "./policies/user.policy";

export type AuthorizeParams<
  R extends ResourceType,
  A extends ResourceAction<R>,
> =
  A extends CollectionLevelAction<R>
    ? {
        user: User;
        resource: R;
        action: A;
        container?: ResourceContainer<R>;
      }
    : {
        user: User;
        resource:
          | {
              type: R;
              target: ResourceTarget<R>;
            }
          | {
              type: R;
              attributes: ResourceAttributes<R>;
            };
        action: A;
      };

export class AuthorizationService {
  private readonly engine: PolicyEngine;
  private readonly cache: AuthorizationCache;
  private readonly loader: AttributeLoader;

  constructor(
    services: DomainServices,
    cache: AuthorizationCache,
    engine?: PolicyEngine,
  ) {
    this.cache = cache;
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

  async authorize<R extends ResourceType, A extends ResourceAction<R>>(
    params: AuthorizeParams<R, A>,
  ): Promise<Result<Decision, DatabaseError>> {
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
        const containerInput =
          "container" in params ? params.container : undefined;

        const containerAttributes = yield* Result.await(
          this.loader.loadScopeData({
            resource: resourceType as R,
            container: containerInput,
            user: params.user,
          }),
        );

        decision = this.engine.evaluate({
          user: params.user,
          resource: resourceType as R,
          action: params.action,
          container: containerAttributes ?? undefined,
        } as AuthorizeEngineParams<R, A>);
      } else {
        const resWrapper = (
          params as {
            resource:
              | { type: R; target: ResourceTarget<R> }
              | {
                  type: R;
                  attributes: ResourceAttributes<R>;
                };
          }
        ).resource;

        let resourceAttributes: ResourceAttributes<R> | null = null;

        if ("attributes" in resWrapper && resWrapper.attributes) {
          resourceAttributes = resWrapper.attributes;
        } else if ("target" in resWrapper && resWrapper.target) {
          resourceAttributes = yield* Result.await(
            this.loader.loadResourceData({
              resource: resWrapper.type,
              target: resWrapper.target,
              user: params.user,
            }),
          );
        }

        if (!resourceAttributes) {
          decision = deny("Target resource not found for authorization check");
        } else {
          decision = this.engine.evaluate({
            user: params.user,
            resource: { type: resWrapper.type, attributes: resourceAttributes },
            action: params.action,
          } as AuthorizeEngineParams<R, A>);
        }
      }

      if (cacheKey) {
        const ttl = decision.type === "ALLOW" ? 60 : 15;
        await this.cache.set(cacheKey, decision, ttl);
      }

      return Result.ok(decision);
    }, this);
  }

  async checkPermission({
    user,
    query,
  }: {
    user: User;
    query: CheckPermissionQuery;
  }): Promise<Result<Decision, DatabaseError | ValidationError>> {
    const schema = resourceSchemas[query.resource];
    const isCollection = this.engine.isCollectionAction(
      query.resource,
      query.action,
    );

    if (isCollection) {
      const parsedContainer = schema.container.safeParse(query);
      const container = parsedContainer.success
        ? parsedContainer.data
        : undefined;

      return this.authorize({
        user,
        resource: query.resource,
        action: query.action,
        container,
      } as unknown as AuthorizeParams<
        ResourceType,
        ResourceAction<ResourceType>
      >);
    }

    const parsedTarget = schema.target.safeParse(query);
    if (!parsedTarget.success) {
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
        target: parsedTarget.data,
      },
      action: query.action,
    } as unknown as AuthorizeParams<
      ResourceType,
      ResourceAction<ResourceType>
    >);
  }

  private computeCacheKey<R extends ResourceType, A extends ResourceAction<R>>(
    params: AuthorizeParams<R, A>,
  ): string | null {
    const { user, action } = params;

    if (typeof params.resource === "string") {
      const container = "container" in params ? params.container : undefined;
      const key = container ? JSON.stringify(container) : "root";
      return `authz:${user.id}:${params.resource}:${String(action)}:${key}`;
    }

    const res = params.resource;
    if ("target" in res && res.target) {
      return `authz:${user.id}:${res.type}:${String(action)}:${JSON.stringify(res.target)}`;
    }

    return null;
  }
}
