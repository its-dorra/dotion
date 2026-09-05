import type {
  ResourceType,
  ResourceAction,
  ResourceInput,
  ScopeInput,
  CollectionLevelAction,
} from '@dotion/shared/authorization/types'

export type CanParams<R extends ResourceType, A extends ResourceAction<R>> =
  A extends CollectionLevelAction<R>
    ? { resource: R; action: A; scope?: ScopeInput<R> }
    : { resource: { type: R; id: ResourceInput<R> }; action: A }
