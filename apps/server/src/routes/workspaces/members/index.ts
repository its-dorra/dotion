import { createRoute } from "#/lib/create-app";
import * as handlers from "./handlers";
import * as routes from "./routes";

const route = createRoute()
  .openapi(routes.listMembersRoute, handlers.listMembersHandler)
  .openapi(routes.updateMemberRoleRoute, handlers.updateMemberRoleHandler)
  .openapi(routes.removeMemberRoute, handlers.removeMemberHandler);

export default route;
