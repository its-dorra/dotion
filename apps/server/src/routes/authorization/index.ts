import { createRoute } from "#/lib/create-app";
import { checkPermissionRoute } from "./routes";
import { checkPermissionHandler } from "./handlers";

const authorizationRouter = createRoute().openapi(
  checkPermissionRoute,
  checkPermissionHandler,
);

export default authorizationRouter;
