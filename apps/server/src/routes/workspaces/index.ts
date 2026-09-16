import { createRoute } from "#/lib/create-app";
import * as handlers from "./handlers";
import * as routes from "./routes";
import pagesRoute from "./pages";
import membersRoute from "./members";
import candidateUsersRoute from "./candidate-users";
import searchRoute from "./search";
import assistantRoute from "./assistant";
import { userInvitationsRoute, workspaceInvitationsRoute } from "./invitations";
import { errorResponseJson } from "#/lib/utils";
import { currentUserMiddleware } from "#/middlewares/current-user-middleware";
import { requirePermission } from "#/middlewares/authorize-middleware";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";

const route = createRoute()
  .route("/invitations", userInvitationsRoute)
  .openapi(routes.listRoute, handlers.listHandler)
  .openapi(routes.createRoute, handlers.createHandler)
  .openapi(routes.getByIdRoute, handlers.getByIdHandler)
  .route("/:id/candidate-users", candidateUsersRoute)
  .route("/:id/invitations", workspaceInvitationsRoute)
  .route("/:id/members", membersRoute)
  .route("/:id/pages", pagesRoute)
  .route("/:id/search", searchRoute)
  .route("/:id/assistant", assistantRoute);

route.get(
  "/:id/ws",
  currentUserMiddleware,
  requirePermission({
    resource: "workspace",
    action: "view",
    mapInput: ({ params }) => ({ workspaceId: params.id as WorkspaceId }),
  }),
  async (c) => {
    const upgradeHeader = c.req.header("Upgrade");
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
      return c.json(errorResponseJson("WebSocket connection required"), 400);
    }

    const workspaceId = c.req.param("id") as WorkspaceId;
    const currentUser = c.var.currentUser;

    const id = c.env.DOTION_WORKSPACE_DO.idFromName(workspaceId);
    const stub = c.env.DOTION_WORKSPACE_DO.get(id);

    const headers = new Headers(c.req.raw.headers);

    headers.set("X-User-Id", currentUser.id);
    headers.set("X-Workspace-Id", workspaceId);
    headers.set("X-Permissions", "workspace:view");

    return await stub.fetch(c.req.raw, {
      headers,
    });
  },
);

export default route;
