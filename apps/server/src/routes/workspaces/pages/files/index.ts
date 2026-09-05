import { createRoute } from "#/lib/create-app";
import * as handlers from "./handlers";
import * as routes from "./routes";

const filesRoute = createRoute()
  .openapi(routes.uploadRoute, handlers.uploadHandler)
  .openapi(routes.getRoute, handlers.getHandler);

export default filesRoute;
