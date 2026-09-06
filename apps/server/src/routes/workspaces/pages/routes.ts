import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import { workspaceId } from "@dotion/shared/workspaces/schema";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import z from "zod";
import { zodList, zodSuccessResponse } from "#/lib/zod-helpers";
import {
  pageId,
  PageSchema,
  CreatePageSchema,
} from "@dotion/shared/pages/schema";
import {
  badRequestErrorSchema,
  forbiddenSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";

const tags = ["Pages"];

export const listRoute = createAuthorizedRoute({
  tags,
  method: "get",
  path: "/",
  authorization: {
    resource: "page",
    action: "list",
    mapScope: ({ params }) => ({ workspaceId: params.id }),
  },
  request: {
    params: z.object({
      id: workspaceId,
    }),
  },

  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(
        zodList(
          PageSchema.pick({
            id: true,
            icon: true,
            title: true,
            parentId: true,
          }),
        ),
      ),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const getByIdRoute = createAuthorizedRoute({
  tags,
  method: "get",
  path: "/{pageId}",
  authorization: {
    resource: "page",
    action: "view",
    mapInput: ({ params }) => ({
      pageId: params.pageId,
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(PageSchema),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundErrorSchema,
      HttpStatusPhrases.NOT_FOUND,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const createRoute = createAuthorizedRoute({
  tags,
  summary: "Create a page in a workspace",
  description: "Creates a page in a workspace for the authenticated user.",
  method: "post",
  path: "/",
  authorization: {
    resource: "page",
    action: "create",
    mapScope: ({ params }) => ({ workspaceId: params.id }),
  },
  request: {
    params: z.object({
      id: workspaceId,
    }),
    body: jsonContentRequired(
      CreatePageSchema.omit({ workspaceId: true }),
      "The page to create",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      zodSuccessResponse(
        PageSchema.pick({
          id: true,
          workspaceId: true,
          parentId: true,
          icon: true,
        }),
      ),
      HttpStatusPhrases.CREATED,
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestErrorSchema,
      HttpStatusPhrases.BAD_REQUEST,
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      badRequestErrorSchema,
      HttpStatusPhrases.UNPROCESSABLE_ENTITY,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const listTrashRoute = createAuthorizedRoute({
  tags,
  summary: "List trashed pages in a workspace",
  description:
    "Returns all pages currently marked as inTrash in the workspace.",
  method: "get",
  path: "/trash",
  authorization: {
    resource: "page",
    action: "listTrash",
    mapScope: ({ params }) => ({ workspaceId: params.id }),
  },
  request: {
    params: z.object({
      id: workspaceId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(zodList(PageSchema)),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const moveToTrashRoute = createAuthorizedRoute({
  tags,
  summary: "Move a page to trash",
  description: "Marks a page and its descendants as inTrash.",
  method: "post",
  path: "/{pageId}/trash",
  authorization: {
    resource: "page",
    action: "delete",
    mapInput: ({ params }) => ({
      pageId: params.pageId,
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(z.object({ success: z.boolean() })),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundErrorSchema,
      HttpStatusPhrases.NOT_FOUND,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const restoreFromTrashRoute = createAuthorizedRoute({
  tags,
  summary: "Restore a page from trash",
  description: "Restores a trashed page back to the workspace tree.",
  method: "post",
  path: "/{pageId}/restore",
  authorization: {
    resource: "page",
    action: "restore",
    mapInput: ({ params }) => ({
      pageId: params.pageId,
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(PageSchema),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundErrorSchema,
      HttpStatusPhrases.NOT_FOUND,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const deletePermanentlyRoute = createAuthorizedRoute({
  tags,
  summary: "Permanently delete a page",
  description:
    "Permanently deletes a page from the database and cleans up assets.",
  method: "delete",
  path: "/{pageId}",
  authorization: {
    resource: "page",
    action: "deletePermanently",
    mapInput: ({ params }) => ({
      pageId: params.pageId,
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(z.object({ success: z.boolean() })),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundErrorSchema,
      HttpStatusPhrases.NOT_FOUND,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export type ListRoute = typeof listRoute;
export type GetByIdRoute = typeof getByIdRoute;
export type CreateRoute = typeof createRoute;
export type ListTrashRoute = typeof listTrashRoute;
export type MoveToTrashRoute = typeof moveToTrashRoute;
export type RestoreFromTrashRoute = typeof restoreFromTrashRoute;
export type DeletePermanentlyRoute = typeof deletePermanentlyRoute;
