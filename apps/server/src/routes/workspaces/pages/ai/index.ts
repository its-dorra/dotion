import { createRoute } from "#/lib/create-app";
import * as handlers from "./handlers";
import * as routes from "./routes";

const route = createRoute().openapi(
  routes.streamTextRoute,
  handlers.streamTextHandler,
);

export default route;
