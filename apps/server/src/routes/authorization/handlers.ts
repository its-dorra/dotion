import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "#/lib/types";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import type { CheckPermissionRoute } from "./routes";

export const checkPermissionHandler: AppRouteHandler<
  CheckPermissionRoute
> = async (c) => {
  const currentUser = c.var.currentUser;
  const query = c.req.valid("query");

  const result = await c.var.services.authorization.checkPermission(
    currentUser,
    query,
  );

  if (result.isErr()) {
    return result.error.match({
      ValidationError: (err) =>
        c.json(errorResponseJson(err.message), HttpStatusCodes.BAD_REQUEST),
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to evaluate authorization policy"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  const decision = result.value;
  return c.json(
    successResponseJson({
      allowed: decision.type === "ALLOW",
      reason: decision.reason,
    }),
    HttpStatusCodes.OK,
  );
};
