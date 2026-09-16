import type { z } from "zod";
import type {
  resourceSchemas,
  CheckPermissionQuerySchema,
  CheckPermissionResponseSchema,
} from "./schema";

export type ResourceSchemas = typeof resourceSchemas;
export type ResourceType = keyof ResourceSchemas;

export type ResourceTarget<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["target"]
>;
export type ResourceContainer<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["container"]
>;
export type ResourceAttributes<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["attributes"]
>;
export type ContainerAttributes<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["containerAttributes"]
>;

// Backward compatibility aliases
export type ResourceInput<R extends ResourceType> = ResourceTarget<R>;
export type ScopeInput<R extends ResourceType> = ResourceContainer<R>;
export type ResourceData<R extends ResourceType> = ResourceAttributes<R>;
export type ScopeData<R extends ResourceType> = ContainerAttributes<R>;

export type InstanceLevelAction<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["instanceActions"]
>;
export type CollectionLevelAction<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["collectionActions"]
>;
export type ResourceAction<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["actions"]
>;

export type PermissionKey<R extends ResourceType = ResourceType> =
  R extends ResourceType ? `${R}:${ResourceAction<R>}` : never;

export type CheckPermissionQuery = z.infer<typeof CheckPermissionQuerySchema>;
export type CheckPermissionResponse = z.infer<
  typeof CheckPermissionResponseSchema
>;

export type CanParams<R extends ResourceType, A extends ResourceAction<R>> =
  A extends CollectionLevelAction<R>
    ? {
        resource: R;
        action: A;
        container?: ResourceContainer<R>;
      }
    : { resource: { type: R; id: ResourceTarget<R> }; action: A };
