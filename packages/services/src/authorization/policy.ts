import type { User } from "@dotion/auth";
import type { Decision } from "@dotion/shared/authorization/decisions";
import type {
  ResourceType,
  ResourceData,
  ScopeData,
  InstanceLevelAction,
  CollectionLevelAction,
} from "@dotion/shared/authorization/types";
import type { AuthorizationContext } from "./context";

export interface InstancePolicyParams<R extends ResourceType> {
  user: User;
  resource: ResourceData<R>;
  context: AuthorizationContext;
}

export interface CollectionPolicyParams<R extends ResourceType> {
  user: User;
  scope?: ScopeData<R>;
  context: AuthorizationContext;
}

export type InstancePolicyHandler<R extends ResourceType> = (
  params: InstancePolicyParams<R>,
) => Decision;

export type CollectionPolicyHandler<R extends ResourceType> = (
  params: CollectionPolicyParams<R>,
) => Decision;

export type ResourcePolicy<R extends ResourceType> = {
  [A in InstanceLevelAction<R>]?: InstancePolicyHandler<R>;
} & {
  [A in CollectionLevelAction<R>]?: CollectionPolicyHandler<R>;
};

export interface DefinedResourcePolicy<R extends ResourceType> {
  readonly resource: R;
  readonly handlers: ResourcePolicy<R>;
}

export function defineResourcePolicy<R extends ResourceType>(
  resource: R,
  handlers: ResourcePolicy<R>,
): DefinedResourcePolicy<R> {
  return {
    resource,
    handlers,
  };
}
