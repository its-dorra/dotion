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
  workspaceInvitationId,
  WorkspaceSchema,
  InviteMemberSchema,
  WorkspaceInvitationWithDetailsSchema,
  PaginatedWorkspaceInvitationsDataSchema,
} from "@dotion/shared/workspaces/schema";
import { PaginationQuerySchema } from "@dotion/shared/pagination/schema";
import z from "zod";

const tags = ["Workspace Invitations"];

export const inviteMemberRoute = createAuthorizedRoute({
  tags,
  summary: "Invite a user to a workspace",
  description:
    "Creates a pending workspace invitation and triggers a real-time notification to the invited user.",
  method: "post",
  path: "/",
  authorization: {
    resource: "workspace",
    action: "inviteMember",
    mapInput: ({ params }) => ({ workspaceId: params.id }),
  },
  request: {
    params: z.object({
      id: workspaceId,
    }),
    body: jsonContentRequired(InviteMemberSchema, "User to invite"),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      zodSuccessResponse(WorkspaceInvitationWithDetailsSchema),
      HttpStatusPhrases.CREATED,
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

export const listWorkspaceInvitationsRoute = createAuthorizedRoute({
  tags,
  summary: "List workspace pending invitations",
  description: "Returns pending invitations for the specified workspace.",
  method: "get",
  path: "/",
  authorization: {
    resource: "workspaceInvitation",
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
      zodSuccessResponse(PaginatedWorkspaceInvitationsDataSchema),
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

export const cancelWorkspaceInvitationRoute = createAuthorizedRoute({
  tags,
  summary: "Cancel a workspace invitation",
  description: "Cancels a pending invitation to a workspace.",
  method: "delete",
  path: "/{invitationId}",
  authorization: {
    resource: "workspaceInvitation",
    action: "cancel",
    mapInput: ({ params }) => ({ invitationId: params.invitationId }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      invitationId: workspaceInvitationId,
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

export const acceptInvitationRoute = createAuthorizedRoute({
  tags,
  summary: "Accept workspace invitation",
  description:
    "Accepts a pending workspace invitation and adds the authenticated user to the workspace as a member.",
  method: "post",
  path: "/{invitationId}/accept",
  authorization: {
    resource: "workspaceInvitation",
    action: "accept",
    mapInput: ({ params }) => ({ invitationId: params.invitationId }),
  },
  request: {
    params: z.object({
      invitationId: workspaceInvitationId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(WorkspaceSchema),
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

export const declineInvitationRoute = createAuthorizedRoute({
  tags,
  summary: "Decline workspace invitation",
  description: "Declines a pending workspace invitation.",
  method: "post",
  path: "/{invitationId}/decline",
  authorization: {
    resource: "workspaceInvitation",
    action: "decline",
    mapInput: ({ params }) => ({ invitationId: params.invitationId }),
  },
  request: {
    params: z.object({
      invitationId: workspaceInvitationId,
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

export type InviteMemberRoute = typeof inviteMemberRoute;
export type ListWorkspaceInvitationsRoute =
  typeof listWorkspaceInvitationsRoute;
export type CancelWorkspaceInvitationRoute =
  typeof cancelWorkspaceInvitationRoute;
export type AcceptInvitationRoute = typeof acceptInvitationRoute;
export type DeclineInvitationRoute = typeof declineInvitationRoute;
