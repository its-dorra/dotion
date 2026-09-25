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
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
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
> = (A extends CollectionLevelAction<R>
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
    }) & { workspaceId?: WorkspaceId };

export class AuthorizationService {
  private readonly engine: PolicyEngine;
  private readonly cache: AuthorizationCache;
  private readonly loader: AttributeLoader;

  constructor(services: DomainServices, cache: AuthorizationCache) {
    this.cache = cache;
    this.loader = new AttributeLoader(services);

    this.engine = new PolicyEngine()
      .register(workspacePolicy)
      .register(workspaceMemberPolicy)
      .register(workspaceInvitationPolicy)
      .register(pagePolicy)
      .register(pagePermissionPolicy)
      .register(commentPolicy)
      .register(userPolicy);
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
        const ttl = decision.type === "ALLOW" ? 15 * 60 : 60;
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
    const [resource, action] = query.permission.split(":") as [
      ResourceType,
      ResourceAction<ResourceType>,
    ];
    const schema = resourceSchemas[resource];
    const isCollection = this.engine.isCollectionAction(resource, action);

    if (isCollection) {
      const parsedContainer = schema.container.safeParse(query);
      const container = parsedContainer.success
        ? parsedContainer.data
        : undefined;

      return this.authorize({
        user,
        resource,
        action,
        container,
        workspaceId: query.workspaceId,
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
        type: resource,
        target: parsedTarget.data,
      },
      action,
      workspaceId: query.workspaceId,
    } as unknown as AuthorizeParams<
      ResourceType,
      ResourceAction<ResourceType>
    >);
  }

  private computeCacheKey<R extends ResourceType, A extends ResourceAction<R>>(
    params: AuthorizeParams<R, A>,
  ): string | null {
    const { user, action } = params;

    let resourceName: string;
    let pageId: string = "_";
    let workspaceId: string = params.workspaceId ?? "_";

    if (typeof params.resource === "string") {
      resourceName = params.resource;
      const container = (
        "container" in params ? params.container : undefined
      ) as Record<string, unknown> | undefined;
      if (container) {
        if ("pageId" in container && container.pageId) {
          pageId = String(container.pageId);
        }
        if (
          "workspaceId" in container &&
          container.workspaceId &&
          workspaceId === "_"
        ) {
          workspaceId = String(container.workspaceId);
        }
      }
    } else {
      resourceName = params.resource.type;
      const target = (
        "target" in params.resource ? params.resource.target : undefined
      ) as Record<string, unknown> | undefined;
      if (target) {
        if ("pageId" in target && target.pageId) {
          pageId = String(target.pageId);
        }
        if (
          "workspaceId" in target &&
          target.workspaceId &&
          workspaceId === "_"
        ) {
          workspaceId = String(target.workspaceId);
        }
      }
      const attributes = (
        "attributes" in params.resource ? params.resource.attributes : undefined
      ) as Record<string, unknown> | undefined;
      if (attributes) {
        if ("pageId" in attributes && attributes.pageId && pageId === "_") {
          pageId = String(attributes.pageId);
        }
        if (
          "workspaceId" in attributes &&
          attributes.workspaceId &&
          workspaceId === "_"
        ) {
          workspaceId = String(attributes.workspaceId);
        }
      }
    }

    return `authz:${user.id}:${workspaceId}:${pageId}:${resourceName}:${String(action)}`;
  }
}
