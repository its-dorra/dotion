import {
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";
import { currentUserMiddleware } from "#/middlewares/current-user-middleware";
import { createRoute as createOpenApiRoute } from "@hono/zod-openapi";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { zodSuccessResponse } from "#/lib/zod-helpers";
import { PaginationQuerySchema } from "@dotion/shared/pagination/schema";
import {
  notificationId,
  PaginatedNotificationsDataSchema,
} from "@dotion/shared/notifications/schema";
import { z } from "zod";

const tags = ["notifications"];

export const listRoute = createOpenApiRoute({
  tags,
  summary: "List notifications for the authenticated user",
  description: "Returns paginated notifications for the authenticated user.",
  method: "get",
  path: "/",
  middleware: [currentUserMiddleware] as const,
  request: {
    query: PaginationQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(PaginatedNotificationsDataSchema),
      HttpStatusPhrases.OK,
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

export const markAsReadRoute = createOpenApiRoute({
  tags,
  summary: "Mark notification as read",
  description:
    "Marks a specific notification as read for the authenticated user.",
  method: "patch",
  path: "/{id}/read",
  middleware: [currentUserMiddleware] as const,
  request: {
    params: z.object({
      id: notificationId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(z.object({ success: z.literal(true) })),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundErrorSchema,
      HttpStatusPhrases.NOT_FOUND,
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

export const markAllAsReadRoute = createOpenApiRoute({
  tags,
  summary: "Mark all notifications as read",
  description: "Marks all notifications as read for the authenticated user.",
  method: "post",
  path: "/read-all",
  middleware: [currentUserMiddleware] as const,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(z.object({ success: z.literal(true) })),
      HttpStatusPhrases.OK,
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

export type ListRoute = typeof listRoute;
export type MarkAsReadRoute = typeof markAsReadRoute;
export type MarkAllAsReadRoute = typeof markAllAsReadRoute;
