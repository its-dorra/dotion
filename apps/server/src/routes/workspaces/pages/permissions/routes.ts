import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import z from "zod";
import { workspaceId } from "@dotion/shared/workspaces/schema";
import {
  pageId,
  PaginatedPageMemberPermissionsSchema,
  PageMemberPermissionSchema,
  UpdatePagePermissionRoleSchema,
} from "@dotion/shared/pages/schema";
import { userId } from "@dotion/shared/users/schema";
import { PaginationQuerySchema } from "@dotion/shared/pagination/schema";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { zodSuccessResponse } from "#/lib/zod-helpers";
import {
  badRequestErrorSchema,
  forbiddenSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";

const tags = ["Page Permissions"];

export const listPermissionsRoute = createAuthorizedRoute({
  tags,
  summary: "Get paginated member permissions for a page",
  method: "get",
  path: "/",
  authorization: {
    resource: "pagePermission",
    action: "list",
    mapScope: ({ params }) => ({ pageId: params.pageId }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
    }),
    query: PaginationQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(PaginatedPageMemberPermissionsSchema),
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

export const updatePermissionRoute = createAuthorizedRoute({
  tags,
  summary: "Update member permission role on a page",
  method: "patch",
  path: "/{memberId}",
  authorization: {
    resource: "pagePermission",
    action: "update",
    mapInput: ({ params }) => ({
      pageId: params.pageId,
      targetUserId: params.memberId,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
      memberId: userId,
    }),
    body: jsonContentRequired(
      UpdatePagePermissionRoleSchema,
      "New role for member",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(PageMemberPermissionSchema),
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

export type ListPermissionsRoute = typeof listPermissionsRoute;
export type UpdatePermissionRoute = typeof updatePermissionRoute;
