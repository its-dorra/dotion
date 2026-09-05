import { createRoute as createOpenApiRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import {
  badRequestErrorSchema,
  internalServerErrorSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";
import { zodSuccessResponse } from "#/lib/zod-helpers";
import { currentUserMiddleware } from "#/middlewares/current-user-middleware";
import {
  CheckPermissionQuerySchema,
  CheckPermissionResponseSchema,
} from "@dotion/shared/authorization/schema";

const tags = ["authorization"];

export const checkPermissionRoute = createOpenApiRoute({
  tags,
  summary: "Check user permission for an action on a resource",
  description:
    "Evaluates whether the authenticated user has permission to perform a specific action on an instance or collection.",
  method: "get",
  path: "/check",
  middleware: [currentUserMiddleware] as const,
  request: {
    query: CheckPermissionQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(CheckPermissionResponseSchema),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestErrorSchema,
      HttpStatusPhrases.BAD_REQUEST,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export type CheckPermissionRoute = typeof checkPermissionRoute;
