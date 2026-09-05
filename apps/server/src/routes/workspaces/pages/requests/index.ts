import { createRoute } from "#/lib/create-app";
import * as handlers from "./handlers";
import * as routes from "./routes";

const route = createRoute()
  .openapi(routes.createRequestRoute, handlers.createRequestHandler)
  .openapi(routes.getRequestStatusRoute, handlers.getRequestStatusHandler)
  .openapi(routes.approveRequestRoute, handlers.approveRequestHandler)
  .openapi(routes.rejectRequestRoute, handlers.rejectRequestHandler);

export default route;
