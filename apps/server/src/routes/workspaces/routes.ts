import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import {
  badRequestErrorSchema,
  forbiddenSchema,
  internalServerErrorSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { zodList, zodSuccessResponse } from "#/lib/zod-helpers";
import {
  CreateWorkspaceSchema,
  workspaceId,
  WorkspaceSchema,
} from "@dotion/shared/workspaces/schema";
import z from "zod";

const tags = ["workspaces"];

export const listRoute = createAuthorizedRoute({
  tags,
  summary: "List all workspaces for the authenticated user",
  description: "Returns all workspaces for the authenticated user.",
  method: "get",
  path: "/",
  authorization: {
    resource: "workspace",
    action: "list",
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(zodList(WorkspaceSchema)),
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

export const createRoute = createAuthorizedRoute({
  tags,
  summary: "Create a new workspace",
  description:
    "Creates a new workspace and adds the authenticated user as the owner.",
  method: "post",
  path: "/",
  authorization: {
    resource: "workspace",
    action: "create",
  },
  request: {
    body: jsonContentRequired(CreateWorkspaceSchema, "The workspace to create"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      zodSuccessResponse(WorkspaceSchema),
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

export const getByIdRoute = createAuthorizedRoute({
  tags,
  summary: "Get a workspace by ID",
  description: "Returns a workspace by ID for the authenticated user.",
  method: "get",
  path: "/{id}",
  authorization: {
    resource: "workspace",
    action: "view",
    mapInput: ({ params }) => ({ workspaceId: params.id }),
  },
  request: {
    params: z.object({
      id: workspaceId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(WorkspaceSchema),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      badRequestErrorSchema,
      HttpStatusPhrases.NOT_FOUND,
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

export type ListRoute = typeof listRoute;
export type CreateRoute = typeof createRoute;
export type GetByIdRoute = typeof getByIdRoute;
