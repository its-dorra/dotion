import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import {
  badRequestErrorSchema,
  forbiddenSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { zodSuccessResponse } from "#/lib/zod-helpers";
import {
  workspaceId,
  WorkspaceMemberDetailSchema,
  UpdateMemberRoleSchema,
  PaginatedWorkspaceMembersDataSchema,
} from "@dotion/shared/workspaces/schema";
import { userId } from "@dotion/shared/users/schema";
import { PaginationQuerySchema } from "@dotion/shared/pagination/schema";
import z from "zod";

const tags = ["Workspace Members"];

export const listMembersRoute = createAuthorizedRoute({
  tags,
  summary: "List workspace members",
  description: "Returns paginated members of the specified workspace.",
  method: "get",
  path: "/",
  authorization: {
    resource: "workspaceMember",
    action: "list",
    mapScope: ({ params }) => ({ workspaceId: params.id }),
  },
  request: {
    params: z.object({
      id: workspaceId,
    }),
    query: PaginationQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(PaginatedWorkspaceMembersDataSchema),
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

export const updateMemberRoleRoute = createAuthorizedRoute({
  tags,
  summary: "Update member role",
  description: "Updates the role of a member in the workspace.",
  method: "patch",
  path: "/{memberId}",
  authorization: {
    resource: "workspaceMember",
    action: "updateRole",
    mapInput: ({ params }) => ({
      workspaceId: params.id,
      memberUserId: params.memberId,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      memberId: userId,
    }),
    body: jsonContentRequired(UpdateMemberRoleSchema, "New role for member"),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(WorkspaceMemberDetailSchema),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestErrorSchema,
      HttpStatusPhrases.BAD_REQUEST,
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundErrorSchema,
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

export const removeMemberRoute = createAuthorizedRoute({
  tags,
  summary: "Remove member from workspace",
  description: "Removes a member from the workspace.",
  method: "delete",
  path: "/{memberId}",
  authorization: {
    resource: "workspaceMember",
    action: "remove",
    mapInput: ({ params }) => ({
      workspaceId: params.id,
      memberUserId: params.memberId,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      memberId: userId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(z.object({ success: z.literal(true) })),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestErrorSchema,
      HttpStatusPhrases.BAD_REQUEST,
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundErrorSchema,
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

export type ListMembersRoute = typeof listMembersRoute;
export type UpdateMemberRoleRoute = typeof updateMemberRoleRoute;
export type RemoveMemberRoute = typeof removeMemberRoute;
