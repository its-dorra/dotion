import type { z } from "zod";
import type {
  resourceSchemas,
  CheckPermissionQuerySchema,
  CheckPermissionResponseSchema,
} from "./schema";

export type ResourceSchemas = typeof resourceSchemas;
export type ResourceType = keyof ResourceSchemas;

export type ScopeInput<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["scopeInput"]
>;
export type ResourceInput<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["input"]
>;
export type ResourceData<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["data"]
>;
export type ScopeData<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["scope"]
>;
export type InstanceLevelAction<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["instanceActions"]
>;
export type CollectionLevelAction<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["collectionActions"]
>;
export type ResourceAction<R extends ResourceType> = z.infer<
  ResourceSchemas[R]["actions"]
>;

export type CheckPermissionQuery = z.infer<typeof CheckPermissionQuerySchema>;
export type CheckPermissionResponse = z.infer<
  typeof CheckPermissionResponseSchema
>;

export type CanParams<R extends ResourceType, A extends ResourceAction<R>> =
  A extends CollectionLevelAction<R>
    ? { resource: R; action: A; scope?: ScopeInput<R> }
    : { resource: { type: R; id: ResourceInput<R> }; action: A };
