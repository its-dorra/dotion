import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "#/lib/types";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import type { CreateRoute, GetByIdRoute, ListRoute } from "./routes";

export const listHandler: AppRouteHandler<ListRoute> = async (c) => {
  const currentUser = c.var.currentUser;
  const workspaceId = c.req.valid("param").id;

  const result = await c.var.services.pages.getPagesTree(
    workspaceId,
    currentUser.id,
  );

  if (result.isErr()) {
    console.error("Error fetching pages:", result.error);
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to get pages"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const getByIdHandler: AppRouteHandler<GetByIdRoute> = async (c) => {
  const currentUser = c.var.currentUser;
  const { id: workspaceId, pageId } = c.req.valid("param");

  const result = await c.var.services.pages.getPageWithoutContent(
    workspaceId,
    pageId,
    currentUser.id,
  );

  if (result.isErr()) {
    console.error("Error fetching page:", result.error);
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to get page"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      NotFoundError: () =>
        c.json(errorResponseJson("Page not found"), HttpStatusCodes.NOT_FOUND),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const createHandler: AppRouteHandler<CreateRoute> = async (c) => {
  const currentUser = c.var.currentUser;
  const { id } = c.req.valid("param");
  const input = c.req.valid("json");

  const result = await c.var.services.pages.createPage(
    { userId: currentUser.id },
    {
      ...input,
      workspaceId: id,
    },
  );

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      UniqueConstraintViolationError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.UNPROCESSABLE_ENTITY),
          HttpStatusCodes.UNPROCESSABLE_ENTITY,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.CREATED);
};
