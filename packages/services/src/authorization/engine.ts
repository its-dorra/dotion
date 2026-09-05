import { deny, type Decision } from "@dotion/shared/authorization/decisions";
import { resourceSchemas } from "@dotion/shared/authorization/schema";
import type {
  ResourceType,
  ResourceAction,
  ResourceData,
  ScopeData,
  CollectionLevelAction,
} from "@dotion/shared/authorization/types";
import type { User } from "@dotion/auth";
import type { AuthorizationContext } from "./context";
import type { DefinedResourcePolicy, ResourcePolicy } from "./policy";

export type AuthorizeEngineParams<
  R extends ResourceType,
  A extends ResourceAction<R>,
> =
  A extends CollectionLevelAction<R>
    ? {
        user: User;
        resource: R;
        action: A;
        scope?: ScopeData<R>;
        context: AuthorizationContext;
      }
    : {
        user: User;
        resource: { type: R; data: ResourceData<R> };
        action: A;
        context: AuthorizationContext;
      };

export class PolicyEngine {
  private readonly policies = new Map<ResourceType, ResourcePolicy<any>>();

  register<R extends ResourceType>(policy: DefinedResourcePolicy<R>): this {
    this.policies.set(policy.resource, policy.handlers);
    return this;
  }

  isCollectionAction<R extends ResourceType>(
    resource: R | { type: R },
    action: string,
  ): action is CollectionLevelAction<R> {
    const resourceType: ResourceType =
      typeof resource === "string" ? resource : (resource as { type: R }).type;
    const schema = resourceSchemas[resourceType];
    if (!schema) return false;
    return (
      schema.collectionActions as unknown as {
        safeParse(val: unknown): { success: boolean };
      }
    ).safeParse(action).success;
  }

  evaluate<R extends ResourceType, A extends ResourceAction<R>>(
    params: AuthorizeEngineParams<R, A>,
  ): Decision {
    const { user, action, context } = params;
    const resourceType: ResourceType =
      typeof params.resource === "string"
        ? (params.resource as ResourceType)
        : (params.resource.type as ResourceType);

    const policy = this.policies.get(resourceType);
    if (!policy) {
      return deny(
        `No authorization policy registered for resource: ${resourceType}`,
      );
    }

    const handler = policy[action as keyof typeof policy];
    if (!handler) {
      return deny(
        `No handler registered for action "${String(action)}" on resource "${resourceType}"`,
      );
    }

    if (this.isCollectionAction(resourceType, action)) {
      const scope = "scope" in params ? params.scope : undefined;
      const decision = (handler as Function)({
        user,
        context,
        scope,
      });

      if (decision.type === "ABSTAIN") {
        return deny(
          decision.reason ?? "Access not explicitly allowed by policy",
        );
      }
      return decision;
    }

    const resourceData = (
      params as { resource: { type: R; data: ResourceData<R> } }
    ).resource.data;

    const decision = (handler as Function)({
      user,
      resource: resourceData,
      context,
    });

    if (decision.type === "ABSTAIN") {
      return deny(decision.reason ?? "Access not explicitly allowed by policy");
    }

    return decision;
  }
}
