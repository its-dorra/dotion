import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

import type { AppRouteHandler } from "#/lib/types";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import type {
  CreateRoute,
  GetByIdRoute,
  ListRoute,
  ListTrashRoute,
  MoveToTrashRoute,
  RestoreFromTrashRoute,
  DeletePermanentlyRoute,
  EmptyTrashRoute,
} from "./routes";

export const listHandler: AppRouteHandler<ListRoute> = async (c) => {
  const workspaceId = c.req.valid("param").id;

  const result = await c.var.services.pages.getPagesTree({ workspaceId });

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
  const { id: workspaceId, pageId } = c.req.valid("param");

  const result = await c.var.services.pages.getPageWithoutContent({
    workspaceId,
    pageId,
  });

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
  const { id } = c.req.valid("param");
  const input = c.req.valid("json");

  const result = await c.var.services.pages.createPage({
    ...input,
    workspaceId: id,
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
          errorResponseJson(HttpStatusPhrases.UNPROCESSABLE_ENTITY),
          HttpStatusCodes.UNPROCESSABLE_ENTITY,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.CREATED);
};

export const listTrashHandler: AppRouteHandler<ListTrashRoute> = async (c) => {
  const { id: workspaceId } = c.req.valid("param");

  const result = await c.var.services.pages.getTrashedPages({ workspaceId });

  if (result.isErr()) {
    console.error("Error fetching trashed pages:", result.error);
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to get trashed pages"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const moveToTrashHandler: AppRouteHandler<MoveToTrashRoute> = async (
  c,
) => {
  const { id: workspaceId, pageId } = c.req.valid("param");

  const result = await c.var.services.pages.moveToTrash({
    workspaceId,
    pageId,
  });

  if (result.isErr()) {
    console.error("Error moving page to trash:", result.error);
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to move page to trash"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      NotFoundError: () =>
        c.json(errorResponseJson("Page not found"), HttpStatusCodes.NOT_FOUND),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const restoreFromTrashHandler: AppRouteHandler<
  RestoreFromTrashRoute
> = async (c) => {
  const { id: workspaceId, pageId } = c.req.valid("param");

  const result = await c.var.services.pages.restoreFromTrash({
    workspaceId,
    pageId,
  });

  if (result.isErr()) {
    console.error("Error restoring page from trash:", result.error);
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to restore page"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      NotFoundError: () =>
        c.json(errorResponseJson("Page not found"), HttpStatusCodes.NOT_FOUND),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const deletePermanentlyHandler: AppRouteHandler<
  DeletePermanentlyRoute
> = async (c) => {
  const { id: workspaceId, pageId } = c.req.valid("param");

  const result = await c.var.services.pages.deletePermanently({
    workspaceId,
    pageId,
  });

  if (result.isErr()) {
    console.error("Error permanently deleting page:", result.error);
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to delete page permanently"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      NotFoundError: () =>
        c.json(errorResponseJson("Page not found"), HttpStatusCodes.NOT_FOUND),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const emptyTrashHandler: AppRouteHandler<EmptyTrashRoute> = async (
  c,
) => {
  const { id: workspaceId } = c.req.valid("param");

  const result = await c.var.services.pages.emptyTrash({ workspaceId });

  if (result.isErr()) {
    console.error("Error emptying trash:", result.error);
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to empty trash"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};
