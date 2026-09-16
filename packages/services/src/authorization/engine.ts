import { deny, type Decision } from "@dotion/shared/authorization/decisions";
import { resourceSchemas } from "@dotion/shared/authorization/schema";
import type {
  ResourceType,
  ResourceAction,
  CollectionLevelAction,
} from "@dotion/shared/authorization/types";
import type {
  DefinedResourcePolicy,
  ResourcePolicy,
  AuthorizeEngineParams,
} from "@dotion/shared/authorization/policy";

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
    const { user, action } = params;
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
      const collectionParams = params as Extract<
        AuthorizeEngineParams<R, A>,
        { container: unknown }
      >;
      return (handler as Function)({
        user,
        container: collectionParams.container,
      });
    }

    const instanceParams = params as Extract<
      AuthorizeEngineParams<R, A>,
      { resource: { attributes: unknown } }
    >;

    return (handler as Function)({
      user,
      resource: instanceParams.resource.attributes,
    });
  }
}
