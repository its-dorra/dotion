import type { AppRouteHandler } from "#/lib/types";
import type { ListRoute, MarkAsReadRoute, MarkAllAsReadRoute } from "./routes";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import * as HttpStatusCodes from "stoker/http-status-codes";

import * as HttpStatusPhrases from "stoker/http-status-phrases";

export const listHandler: AppRouteHandler<ListRoute> = async (c) => {
  const currentUser = c.var.currentUser;
  const pagination = c.req.valid("query");

  const result = await c.var.services.notifications.getNotifications(
    currentUser.id,
    pagination,
  );

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const markAsReadHandler: AppRouteHandler<MarkAsReadRoute> = async (
  c,
) => {
  const currentUser = c.var.currentUser;
  const { id } = c.req.valid("param");

  const result = await c.var.services.notifications.markAsRead(
    currentUser.id,
    id,
  );

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      NotFoundError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.NOT_FOUND),
          HttpStatusCodes.NOT_FOUND,
        ),
    });
  }

  return c.json(
    successResponseJson({ success: true as const }),
    HttpStatusCodes.OK,
  );
};

export const markAllAsReadHandler: AppRouteHandler<MarkAllAsReadRoute> = async (
  c,
) => {
  const currentUser = c.var.currentUser;

  const result = await c.var.services.notifications.markAllAsRead(
    currentUser.id,
  );

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(
    successResponseJson({ success: true as const }),
    HttpStatusCodes.OK,
  );
};
