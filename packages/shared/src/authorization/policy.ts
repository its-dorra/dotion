import type { User } from "../users/types";
import type { Decision } from "./decisions";
import type {
  ResourceType,
  ResourceAction,
  ResourceAttributes,
  ContainerAttributes,
  InstanceLevelAction,
  CollectionLevelAction,
} from "./types";

export interface InstancePolicyParams<R extends ResourceType> {
  user: User;
  resource: ResourceAttributes<R>;
}

export interface CollectionPolicyParams<R extends ResourceType> {
  user: User;
  container: ContainerAttributes<R>;
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

export type AuthorizeEngineParams<
  R extends ResourceType,
  A extends ResourceAction<R>,
> =
  A extends CollectionLevelAction<R>
    ? {
        user: User;
        resource: R;
        action: A;
        container: ContainerAttributes<R>;
      }
    : {
        user: User;
        resource: {
          type: R;
          attributes: ResourceAttributes<R>;
        };
        action: A;
      };
