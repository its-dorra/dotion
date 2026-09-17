import type { AppRouteHandler } from "#/lib/types";
import type { CreateRoute, GetByIdRoute, ListRoute } from "./routes";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import * as HttpStatusCodes from "stoker/http-status-codes";

import * as HttpStatusPhrases from "stoker/http-status-phrases";

export const listHandler: AppRouteHandler<ListRoute> = async (c) => {
  const currentUser = c.var.currentUser;

  const result = await c.var.services.workspaces.getAllWorkspaces({
    userId: currentUser.id,
  });

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

export const createHandler: AppRouteHandler<CreateRoute> = async (c) => {
  const currentUser = c.var.currentUser;
  const input = c.req.valid("json");

  const result = await c.var.services.workspaces.createWorkspace({
    input,
    userId: currentUser.id,
  });

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      UniqueConstraintViolationError: () =>
        c.json(
          errorResponseJson("A workspace with this name already exists"),
          HttpStatusCodes.UNPROCESSABLE_ENTITY,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.CREATED);
};

export const getByIdHandler: AppRouteHandler<GetByIdRoute> = async (c) => {
  const currentUser = c.var.currentUser;
  const { id } = c.req.valid("param");

  const result = await c.var.services.workspaces.getWorkspaceById({
    workspaceId: id,
    userId: currentUser.id,
  });

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

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};
