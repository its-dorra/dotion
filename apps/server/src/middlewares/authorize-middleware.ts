import type { AppBindings, HonoContext } from "#/lib/types";
import { errorResponseJson } from "#/lib/utils";
import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { resourceSchemas } from "@dotion/shared/authorization/schema";
import type {
  ResourceType,
  ResourceAction,
  ResourceTarget,
  ResourceContainer,
  CollectionLevelAction,
  InstanceLevelAction,
} from "@dotion/shared/authorization/types";

export interface CollectionAuthorizeOptions<
  R extends ResourceType,
  A extends CollectionLevelAction<R>,
  TParams = Record<string, string>,
> {
  resource: R;
  action: A;
  mapContainer?: (context: {
    params: TParams;
    c: HonoContext;
  }) => ResourceContainer<R> | Promise<ResourceContainer<R>>;
  mapScope?: (context: {
    params: TParams;
    c: HonoContext;
  }) => ResourceContainer<R> | Promise<ResourceContainer<R>>;
}

export interface InstanceAuthorizeOptions<
  R extends ResourceType,
  A extends InstanceLevelAction<R>,
  TParams = Record<string, string>,
> {
  resource: R;
  action: A;
  mapTarget?: (context: {
    params: TParams;
    c: HonoContext;
  }) => ResourceTarget<R> | Promise<ResourceTarget<R>>;
  mapInput?: (context: {
    params: TParams;
    c: HonoContext;
  }) => ResourceTarget<R> | Promise<ResourceTarget<R>>;
}

export type AuthorizeMiddlewareOptions<
  R extends ResourceType,
  A extends ResourceAction<R>,
  TParams = Record<string, string>,
> =
  A extends CollectionLevelAction<R>
    ? CollectionAuthorizeOptions<R, A, TParams>
    : InstanceAuthorizeOptions<R, Extract<A, InstanceLevelAction<R>>, TParams>;

export function requirePermission<
  R extends ResourceType,
  A extends CollectionLevelAction<R>,
  TParams = Record<string, string>,
>(
  options: CollectionAuthorizeOptions<R, A, TParams>,
): ReturnType<typeof createMiddleware<AppBindings>>;

export function requirePermission<
  R extends ResourceType,
  A extends InstanceLevelAction<R>,
  TParams = Record<string, string>,
>(
  options: InstanceAuthorizeOptions<R, A, TParams>,
): ReturnType<typeof createMiddleware<AppBindings>>;

export function requirePermission<
  R extends ResourceType,
  A extends ResourceAction<R>,
  TParams = Record<string, string>,
>(options: AuthorizeMiddlewareOptions<R, A, TParams>) {
  return createMiddleware<AppBindings>(async (c, next) => {
    const currentUser = c.var.currentUser;
    if (!currentUser) {
      return c.json(
        errorResponseJson(HttpStatusPhrases.UNAUTHORIZED),
        HttpStatusCodes.UNAUTHORIZED,
      );
    }

    const { resource, action } = options;
    const isCollection = isCollectionAction(resource, action);
    const routeParams = c.req.param() as TParams;

    if (isCollection) {
      const collectionOpts = options as CollectionAuthorizeOptions<
        R,
        CollectionLevelAction<R>,
        TParams
      >;

      const mapper = collectionOpts.mapContainer ?? collectionOpts.mapScope;
      const container = mapper
        ? await mapper({ params: routeParams, c })
        : undefined;

      const authResult = await c.var.services.authorization.authorize({
        user: currentUser,
        resource,
        action,
        container,
      } as any);

      if (authResult.isErr()) {
        return c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const decision = authResult.value;
      if (decision.type !== "ALLOW") {
        return c.json(
          errorResponseJson(decision.reason ?? HttpStatusPhrases.FORBIDDEN),
          HttpStatusCodes.FORBIDDEN,
        );
      }

      return next();
    } else {
      const instanceOpts = options as InstanceAuthorizeOptions<
        R,
        InstanceLevelAction<R>,
        TParams
      >;

      const mapper = instanceOpts.mapTarget ?? instanceOpts.mapInput;
      const target = mapper
        ? await mapper({
            params: routeParams,
            c,
          })
        : undefined;

      if (!target) {
        return c.json(
          errorResponseJson(HttpStatusPhrases.BAD_REQUEST),
          HttpStatusCodes.BAD_REQUEST,
        );
      }

      const authResult = await c.var.services.authorization.authorize({
        user: currentUser,
        resource: {
          type: resource,
          target,
        },
        action,
      } as any);

      if (authResult.isErr()) {
        return c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        );
      }

      const decision = authResult.value;
      if (decision.type !== "ALLOW") {
        const isNotFound = decision.reason?.includes("not found");
        return c.json(
          errorResponseJson(
            decision.reason ??
              (isNotFound
                ? HttpStatusPhrases.NOT_FOUND
                : HttpStatusPhrases.FORBIDDEN),
          ),
          isNotFound ? HttpStatusCodes.NOT_FOUND : HttpStatusCodes.FORBIDDEN,
        );
      }

      return next();
    }
  });
}

function isCollectionAction(resource: ResourceType, action: string): boolean {
  const schema = resourceSchemas[resource];
  return (
    schema.collectionActions as unknown as {
      safeParse(val: unknown): { success: boolean };
    }
  ).safeParse(action).success;
}
