import { createRoute } from "#/lib/create-app";
import * as handlers from "./handlers";
import * as routes from "./routes";
import commentsRoute from "./comments";
import pagePermissionsRoute from "./permissions";
import requestsRoute from "./requests";
import filesRoute from "./files";
import aiRoute from "./ai";
import { currentUserMiddleware } from "#/middlewares/current-user-middleware";
import { requirePermission } from "#/middlewares/authorize-middleware";
import { errorResponseJson, generateUserColor } from "#/lib/utils";
import type { PageId } from "@dotion/shared/pages/types";
import type { PermissionKey } from "@dotion/shared/authorization/types";

const route = createRoute()
  .openapi(routes.listRoute, handlers.listHandler)
  .openapi(routes.listTrashRoute, handlers.listTrashHandler)
  .openapi(routes.emptyTrashRoute, handlers.emptyTrashHandler)
  .openapi(routes.createRoute, handlers.createHandler)
  .openapi(routes.moveToTrashRoute, handlers.moveToTrashHandler)
  .openapi(routes.restoreFromTrashRoute, handlers.restoreFromTrashHandler)
  .openapi(routes.deletePermanentlyRoute, handlers.deletePermanentlyHandler)
  .openapi(routes.getByIdRoute, handlers.getByIdHandler)
  .route("/:pageId/comments", commentsRoute)
  .route("/:pageId/permissions", pagePermissionsRoute)
  .route("/:pageId/access-requests", requestsRoute)
  .route("/:pageId/files", filesRoute)
  .route("/:pageId/ai", aiRoute);

route.get(
  "/:pageId/ws",
  currentUserMiddleware,
  requirePermission({
    resource: "page",
    action: "view",
    mapInput: ({ params }) => ({ pageId: params.pageId as PageId }),
  }),
  async (c) => {
    const upgradeHeader = c.req.header("Upgrade");
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      return c.json(errorResponseJson("WebSocket connection required"), 400);
    }

    const workspaceId = c.req.param("id");
    const pageId = c.req.param("pageId") as PageId;
    const currentUser = c.var.currentUser;

    if (!workspaceId) {
      return c.json(errorResponseJson("Missing workspaceId"), 400);
    }

    const [updateAuth, commentAuth] = await Promise.all([
      c.var.services.authorization.authorize({
        user: currentUser,
        resource: { type: "page", target: { pageId } },
        action: "update",
      }),
      c.var.services.authorization.authorize({
        user: currentUser,
        resource: "comment",
        action: "create",
        container: { pageId },
      }),
    ]);

    const permissions: PermissionKey[] = ["page:view"];
    if (updateAuth.isOk() && updateAuth.value.type === "ALLOW") {
      permissions.push("page:update");
    }
    if (commentAuth.isOk() && commentAuth.value.type === "ALLOW") {
      permissions.push("comment:create");
    }

    const doId = c.env.DOTION_PAGES_DO.idFromName(pageId);
    const stub = c.env.DOTION_PAGES_DO.get(doId);

    const headers = new Headers(c.req.raw.headers);

    headers.set("X-Workspace-Id", workspaceId);
    headers.set("X-Page-Id", pageId);
    headers.set("X-User-Id", currentUser.id);
    headers.set("X-User-Name", currentUser.name);
    headers.set("X-User-Color", generateUserColor(currentUser.id));
    headers.set("X-Permissions", permissions.join(","));

    return stub.fetch(c.req.raw, {
      headers,
    });
  },
);

export default route;
