import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import { standardApiRateLimit } from "#/middlewares/rate-limit-middleware";
import { workspaceId } from "@dotion/shared/workspaces/schema";
import { pageId } from "@dotion/shared/pages/schema";
import { FileUploadResponseSchema } from "@dotion/shared/files/schema";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { jsonContent } from "stoker/openapi/helpers";
import { zodSuccessResponse } from "#/lib/zod-helpers";
import {
  badRequestErrorSchema,
  forbiddenSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  tooManyRequestsSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";
import { z } from "zod";

const tags = ["Files"];

export const uploadRoute = createAuthorizedRoute({
  tags,
  method: "post",
  path: "/",
  rateLimit: standardApiRateLimit,
  authorization: {
    resource: "page",
    action: "update",
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
    [HttpStatusCodes.CREATED]: jsonContent(
      zodSuccessResponse(FileUploadResponseSchema),
      HttpStatusPhrases.CREATED,
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
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
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const getRoute = createAuthorizedRoute({
  tags,
  method: "get",
  path: "/{fileKey}",
  rateLimit: standardApiRateLimit,
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
      fileKey: z.string().min(1),
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description: "Binary file stream",
      content: {
        "application/octet-stream": {
          schema: z.string().openapi({
            type: "string",
            format: "binary",
          }),
        },
      },
    },
    [HttpStatusCodes.PARTIAL_CONTENT]: {
      description: "Partial Content range stream",
      content: {
        "application/octet-stream": {
          schema: z.string().openapi({
            type: "string",
            format: "binary",
          }),
        },
      },
    },
    [HttpStatusCodes.NOT_MODIFIED]: {
      description: "Not Modified",
    },
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
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

export type UploadRoute = typeof uploadRoute;
export type GetRoute = typeof getRoute;
