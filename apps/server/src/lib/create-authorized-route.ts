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

export type JsonRequestBody<TSchema extends z.ZodType = z.ZodType> = {
  content: {
    "application/json": {
      schema: TSchema;
    };
  };
  description?: string;
  required?: boolean;
};

export type FormDataRequestBody<TSchema extends z.ZodType = z.ZodType> = {
  content: {
    "multipart/form-data": {
      schema: TSchema;
    };
  };
  description?: string;
  required?: boolean;
};

export type BinaryRequestBody<TSchema extends z.ZodType = z.ZodType> = {
  content: {
    "application/octet-stream": {
      schema: TSchema;
    };
  };
  description?: string;
  required?: boolean;
};

export type AnyRequestBody<TSchema extends z.ZodType = z.ZodType> =
  | JsonRequestBody<TSchema>
  | FormDataRequestBody<TSchema>
  | BinaryRequestBody<TSchema>;

export type AuthorizedRouteConfig<
  R extends ResourceType,
  A extends ResourceAction<R>,
  P extends string,
  TMethod extends RouteConfig["method"],
  TResponses extends RouteConfig["responses"],
  TParams extends z.ZodType | undefined = undefined,
  TQuery extends z.ZodType | undefined = undefined,
  TBodySchema extends z.ZodType | undefined = undefined,
  TBody extends AnyRequestBody<z.ZodType> | undefined =
    TBodySchema extends z.ZodType ? JsonRequestBody<TBodySchema> : undefined,
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
    headers?: z.ZodType | z.ZodType[];
    cookies?: z.ZodType;
    body?: TBody;
  };
  authorization: A extends CollectionLevelAction<R>
    ? {
        resource: R;
        action: A;
        mapScope?: (context: {
          params: TParams extends z.ZodType
            ? z.infer<TParams>
            : Record<string, string>;
          query: TQuery extends z.ZodType
            ? z.infer<TQuery>
            : Record<string, string>;
          c: HonoContext;
        }) => ScopeInput<R> | Promise<ScopeInput<R>>;
      }
    : {
        resource: R;
        action: A;
        mapInput: (context: {
          params: TParams extends z.ZodType
            ? z.infer<TParams>
            : Record<string, string>;
          query: TQuery extends z.ZodType
            ? z.infer<TQuery>
            : Record<string, string>;
          body: TBodySchema extends z.ZodType ? z.infer<TBodySchema> : unknown;
          c: HonoContext;
        }) => ResourceInput<R> | Promise<ResourceInput<R>>;
      };
  responses: TResponses;
};

export type ConstructedRoute<
  P extends string,
  TMethod extends RouteConfig["method"],
  TParams extends z.ZodType | undefined,
  TQuery extends z.ZodType | undefined,
  TBodySchema extends z.ZodType | undefined,
  TResponses extends RouteConfig["responses"],
  TBody extends AnyRequestBody<z.ZodType> | undefined =
    TBodySchema extends z.ZodType ? JsonRequestBody<TBodySchema> : undefined,
> = {
  path: P;
  method: TMethod;
  request: (TParams extends z.ZodType ? { params: TParams } : {}) &
    (TQuery extends z.ZodType ? { query: TQuery } : {}) &
    (TBody extends AnyRequestBody<z.ZodType> ? { body: TBody } : {});
  responses: TResponses;
};

export function createAuthorizedRoute<
  R extends ResourceType,
  A extends ResourceAction<R>,
  P extends string,
  TMethod extends RouteConfig["method"],
  TResponses extends RouteConfig["responses"],
  TParams extends z.ZodType | undefined = undefined,
  TQuery extends z.ZodType | undefined = undefined,
  TBodySchema extends z.ZodType | undefined = undefined,
  TBody extends AnyRequestBody<z.ZodType> | undefined =
    TBodySchema extends z.ZodType ? JsonRequestBody<TBodySchema> : undefined,
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
        TParams extends z.ZodType ? z.infer<TParams> : Record<string, string>
      >["mapInput"],
    });
  } else {
    authMiddleware = requirePermission({
      resource: authorization.resource,
      action: authorization.action as Extract<A, CollectionLevelAction<R>>,
      mapScope: authorization.mapScope as CollectionAuthorizeOptions<
        R,
        Extract<A, CollectionLevelAction<R>>,
        TParams extends z.ZodType ? z.infer<TParams> : Record<string, string>
      >["mapScope"],
    });
  }

  return createOpenApiRoute({
    ...(restConfig as RouteConfig),
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
