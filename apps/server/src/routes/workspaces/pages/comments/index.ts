import { createRoute } from "#/lib/create-app";
import * as handlers from "./handlers";
import * as routes from "./routes";

const route = createRoute()
  .openapi(routes.listCommentsRoute, handlers.listCommentsHandler)
  .openapi(routes.createCommentRoute, handlers.createCommentHandler)
  .openapi(routes.resolveCommentRoute, handlers.resolveCommentHandler)
  .openapi(routes.deleteCommentRoute, handlers.deleteCommentHandler);

export default route;
