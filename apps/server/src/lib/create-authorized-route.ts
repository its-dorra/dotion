import {
  createRoute as createOpenApiRoute,
  type RouteConfig,
} from "@hono/zod-openapi";
import type { z } from "zod";
import type { MiddlewareHandler } from "hono";
import type { HonoContext } from "#/lib/types";
import { currentUserMiddleware } from "#/middlewares/current-user-middleware";
import {
  requirePermission,
  type CollectionAuthorizeOptions,
  type InstanceAuthorizeOptions,
} from "#/middlewares/authorize-middleware";
import type {
  ResourceType,
  ResourceAction,
  ResourceInput,
  ScopeInput,
  CollectionLevelAction,
  InstanceLevelAction,
} from "@dotion/shared/authorization/types";

export type JsonRequestBody<TSchema extends z.ZodSchema = z.ZodSchema> = {
  content: {
    "application/json": {
      schema: TSchema;
    };
  };
  description?: string;
  required?: boolean;
};

export type FormDataRequestBody<TSchema extends z.ZodSchema = z.ZodSchema> = {
  content: {
    "multipart/form-data": {
      schema: TSchema;
    };
  };
  description?: string;
  required?: boolean;
};

export type BinaryRequestBody<TSchema extends z.ZodSchema = z.ZodSchema> = {
  content: {
    "application/octet-stream": {
      schema: TSchema;
    };
  };
  description?: string;
  required?: boolean;
};

export type AnyRequestBody<TSchema extends z.ZodSchema = z.ZodSchema> =
  | JsonRequestBody<TSchema>
  | FormDataRequestBody<TSchema>
  | BinaryRequestBody<TSchema>;

export type AuthorizedRouteConfig<
  R extends ResourceType,
  A extends ResourceAction<R>,
  P extends string,
  TMethod extends RouteConfig["method"],
  TResponses extends RouteConfig["responses"],
  TParams extends z.ZodSchema | undefined = undefined,
  TQuery extends z.ZodSchema | undefined = undefined,
  TBodySchema extends z.ZodSchema | undefined = undefined,
  TBody extends AnyRequestBody<z.ZodSchema> | undefined =
    TBodySchema extends z.ZodSchema ? JsonRequestBody<TBodySchema> : undefined,
> = {
  path: P;
  method: TMethod;
  tags?: string[];
  summary?: string;
  description?: string;
  deprecated?: boolean;
  security?: Record<string, string[]>[];
  operationId?: string;
  externalDocs?: RouteConfig["externalDocs"];
  middleware?: readonly MiddlewareHandler[];
  hide?: boolean;
  request?: {
    params?: TParams;
    query?: TQuery;
    headers?: z.ZodSchema | z.ZodSchema[];
    cookies?: z.ZodSchema;
    body?: TBody;
  };
  authorization: A extends CollectionLevelAction<R>
    ? {
        resource: R;
        action: A;
        mapScope?: (context: {
          params: TParams extends z.ZodSchema
            ? z.infer<TParams>
            : Record<string, string>;
          query: TQuery extends z.ZodSchema
            ? z.infer<TQuery>
            : Record<string, string>;
          c: HonoContext;
        }) => ScopeInput<R> | Promise<ScopeInput<R>>;
      }
    : {
        resource: R;
        action: A;
        mapInput: (context: {
          params: TParams extends z.ZodSchema
            ? z.infer<TParams>
            : Record<string, string>;
          query: TQuery extends z.ZodSchema
            ? z.infer<TQuery>
            : Record<string, string>;
          body: TBodySchema extends z.ZodSchema
            ? z.infer<TBodySchema>
            : unknown;
          c: HonoContext;
        }) => ResourceInput<R> | Promise<ResourceInput<R>>;
      };
  responses: TResponses;
};

export type ConstructedRoute<
  P extends string,
  TMethod extends RouteConfig["method"],
  TParams extends z.ZodSchema | undefined,
  TQuery extends z.ZodSchema | undefined,
  TBodySchema extends z.ZodSchema | undefined,
  TResponses extends RouteConfig["responses"],
  TBody extends AnyRequestBody<z.ZodSchema> | undefined =
    TBodySchema extends z.ZodSchema ? JsonRequestBody<TBodySchema> : undefined,
> = {
  path: P;
  method: TMethod;
  request: (TParams extends z.ZodSchema ? { params: TParams } : {}) &
    (TQuery extends z.ZodSchema ? { query: TQuery } : {}) &
    (TBody extends AnyRequestBody<z.ZodSchema> ? { body: TBody } : {});
  responses: TResponses;
};

export function createAuthorizedRoute<
  R extends ResourceType,
  A extends ResourceAction<R>,
  P extends string,
  TMethod extends RouteConfig["method"],
  TResponses extends RouteConfig["responses"],
  TParams extends z.ZodSchema | undefined = undefined,
  TQuery extends z.ZodSchema | undefined = undefined,
  TBodySchema extends z.ZodSchema | undefined = undefined,
  TBody extends AnyRequestBody<z.ZodSchema> | undefined =
    TBodySchema extends z.ZodSchema ? JsonRequestBody<TBodySchema> : undefined,
>(
  config: AuthorizedRouteConfig<
    R,
    A,
    P,
    TMethod,
    TResponses,
    TParams,
    TQuery,
    TBodySchema,
    TBody
  >,
): ConstructedRoute<
  P,
  TMethod,
  TParams,
  TQuery,
  TBodySchema,
  TResponses,
  TBody
> {
  const { authorization, middleware = [], ...restConfig } = config;

  let authMiddleware: MiddlewareHandler;

  if ("mapInput" in authorization) {
    authMiddleware = requirePermission({
      resource: authorization.resource,
      action: authorization.action as Extract<A, InstanceLevelAction<R>>,
      mapInput: authorization.mapInput as InstanceAuthorizeOptions<
        R,
        Extract<A, InstanceLevelAction<R>>,
        TParams extends z.ZodSchema ? z.infer<TParams> : Record<string, string>
      >["mapInput"],
    });
  } else {
    authMiddleware = requirePermission({
      resource: authorization.resource,
      action: authorization.action as Extract<A, CollectionLevelAction<R>>,
      mapScope: authorization.mapScope as CollectionAuthorizeOptions<
        R,
        Extract<A, CollectionLevelAction<R>>,
        TParams extends z.ZodSchema ? z.infer<TParams> : Record<string, string>
      >["mapScope"],
    });
  }

  return createOpenApiRoute({
    ...(restConfig as unknown as RouteConfig),
    middleware: [currentUserMiddleware, authMiddleware, ...middleware],
  }) as unknown as ConstructedRoute<
    P,
    TMethod,
    TParams,
    TQuery,
    TBodySchema,
    TResponses,
    TBody
  >;
}
