import { createRoute } from "#/lib/create-app";
import * as handlers from "./handlers";
import * as routes from "./routes";

const route = createRoute().openapi(
  routes.candidateUsersRoute,
  handlers.candidateUsersHandler,
);

export default route;
