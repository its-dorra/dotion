import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "#/lib/types";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import type { ListPermissionsRoute, UpdatePermissionRoute } from "./routes";

export const listPermissionsHandler: AppRouteHandler<
  ListPermissionsRoute
> = async (c) => {
  const { id: workspaceId, pageId } = c.req.valid("param");
  const pagination = c.req.valid("query");

  const result = await c.var.services.pages.getPagePermissions({
    workspaceId,
    pageId,
    pagination,
  });

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to get page permissions"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const updatePermissionHandler: AppRouteHandler<
  UpdatePermissionRoute
> = async (c) => {
  const { id: workspaceId, pageId, memberId } = c.req.valid("param");
  const { role } = c.req.valid("json");
  const currentUser = c.var.currentUser;

  const result = await c.var.services.pages.updatePagePermission({
    workspaceId,
    pageId,
    targetUserId: memberId,
    role,
    changedBy: { id: currentUser.id, name: currentUser.name },
  });

  if (result.isErr()) {
    return result.error.match({
      NotFoundError: () =>
        c.json(
          errorResponseJson("Workspace member not found"),
          HttpStatusCodes.NOT_FOUND,
        ),
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to update page permission"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};
