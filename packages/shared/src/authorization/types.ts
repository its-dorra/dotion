import type { z } from "zod";
import type { WorkspaceId } from "../workspaces/types";
import type {
  resourceSchemas,
  ResourceType,
  CheckPermissionQuerySchema,
  CheckPermissionResponseSchema,
} from "./schema";
export { AllPermissionsSchema } from "./schema";
export type { ResourceType };

export type ResourceSchemas = typeof resourceSchemas;

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

export type Permission = {
  [R in ResourceType]: `${R}:${ResourceAction<R>}`;
}[ResourceType];

export type PermissionKey = Permission;

export type PermissionResource<P extends Permission> =
  P extends `${infer R extends ResourceType}:${string}` ? R : never;

export type PermissionAction<P extends Permission> =
  P extends `${ResourceType}:${infer A}` ? A : never;

export type CheckPermissionQuery = z.infer<typeof CheckPermissionQuerySchema>;
export type CheckPermissionResponse = z.infer<
  typeof CheckPermissionResponseSchema
>;

export type CanParams<P extends Permission = Permission> =
  P extends `${infer R extends ResourceType}:${infer A}`
    ? A extends CollectionLevelAction<R>
      ? keyof ResourceContainer<R> extends never
        ? {
            permission: P;
            container?: ResourceContainer<R>;
            workspaceId?: WorkspaceId;
          }
        : {
            permission: P;
            container: ResourceContainer<R>;
            workspaceId?: WorkspaceId;
          }
      : { permission: P; target: ResourceTarget<R>; workspaceId?: WorkspaceId }
    : never;
