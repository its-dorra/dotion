import type { AppContext } from "#/context";
import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { Context } from "hono";

type Bindings = Env;

export type AppBindings = { Bindings: Bindings; Variables: AppContext };

export type AppOpenAPI = OpenAPIHono<AppBindings>;

export type HonoContext = Context<AppBindings>;

export type AppRouteHandler<T extends RouteConfig> = RouteHandler<
  T,
  AppBindings
>;
