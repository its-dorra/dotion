import { createRoute } from "#/lib/create-app";
import * as handlers from "./handlers";
import * as routes from "./routes";

export const userInvitationsRoute = createRoute()
  .openapi(routes.acceptInvitationRoute, handlers.acceptInvitationHandler)
  .openapi(routes.declineInvitationRoute, handlers.declineInvitationHandler);

export const workspaceInvitationsRoute = createRoute()
  .openapi(
    routes.listWorkspaceInvitationsRoute,
    handlers.listWorkspaceInvitationsHandler,
  )
  .openapi(routes.inviteMemberRoute, handlers.inviteMemberHandler)
  .openapi(
    routes.cancelWorkspaceInvitationRoute,
    handlers.cancelWorkspaceInvitationHandler,
  );
