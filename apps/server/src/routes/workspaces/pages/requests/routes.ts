import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import z from "zod";
import { workspaceId } from "@dotion/shared/workspaces/schema";
import {
  pageId,
  CreatePageAccessRequestSchema,
  PageAccessRequestSchema,
  PageAccessRequestStatusResponseSchema,
} from "@dotion/shared/pages/schema";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { zodSuccessResponse } from "#/lib/zod-helpers";
import {
  forbiddenSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  tooManyRequestsSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";
import { standardApiRateLimit } from "#/middlewares/rate-limit-middleware";

const tags = ["Page Access Requests"];

export const createRequestRoute = createAuthorizedRoute({
  tags,
  summary: "Request higher access role for a page",
  method: "post",
  path: "/",
  rateLimit: standardApiRateLimit,
  authorization: {
    resource: "page",
    action: "view",
    mapInput: ({ params }) => ({ pageId: params.pageId }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
    }),
    body: jsonContentRequired(
      CreatePageAccessRequestSchema,
      "Access request payload",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      zodSuccessResponse(PageAccessRequestSchema),
      HttpStatusPhrases.CREATED,
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
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const getRequestStatusRoute = createAuthorizedRoute({
  tags,
  summary: "Get current user's pending access request for a page",
  method: "get",
  path: "/status",
  rateLimit: standardApiRateLimit,
  authorization: {
    resource: "page",
    action: "view",
    mapInput: ({ params }) => ({ pageId: params.pageId }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(PageAccessRequestStatusResponseSchema),
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
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const approveRequestRoute = createAuthorizedRoute({
  tags,
  summary: "Approve a page access request",
  method: "post",
  path: "/{requestId}/approve",
  rateLimit: standardApiRateLimit,
  authorization: {
    resource: "page",
    action: "managePermissions",
    mapInput: ({ params }) => ({ pageId: params.pageId }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
      requestId: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(PageAccessRequestSchema),
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
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const rejectRequestRoute = createAuthorizedRoute({
  tags,
  summary: "Reject a page access request",
  method: "post",
  path: "/{requestId}/reject",
  rateLimit: standardApiRateLimit,
  authorization: {
    resource: "page",
    action: "managePermissions",
    mapInput: ({ params }) => ({ pageId: params.pageId }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
      requestId: z.string(),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(PageAccessRequestSchema),
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
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export type CreateRequestRoute = typeof createRequestRoute;
export type GetRequestStatusRoute = typeof getRequestStatusRoute;
export type ApproveRequestRoute = typeof approveRequestRoute;
export type RejectRequestRoute = typeof rejectRequestRoute;
