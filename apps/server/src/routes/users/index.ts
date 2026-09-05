import { createRoute } from "#/lib/create-app";
import * as handlers from "./handlers";
import * as routes from "./routes";
import { errorResponseJson } from "#/lib/utils";
import { currentUserMiddleware } from "#/middlewares/current-user-middleware";

const route = createRoute().openapi(routes.searchRoute, handlers.searchHandler);

route.get("/ws", currentUserMiddleware, async (c) => {
  const upgradeHeader = c.req.header("Upgrade");
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== "websocket") {
    return c.json(errorResponseJson("WebSocket connection required"), 400);
  }

  const userId = c.var.currentUser.id;
  const id = c.env.DOTION_USERS_DO.idFromName(userId);
  const stub = c.env.DOTION_USERS_DO.get(id);

  return await stub.fetch(c.req.raw);
});

export default route;
