import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import { standardApiRateLimit } from "#/middlewares/rate-limit-middleware";
import { workspaceId } from "@dotion/shared/workspaces/schema";
import {
  searchRequestQuerySchema,
  searchResponseSchema,
} from "@dotion/shared/search/schema";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { jsonContent } from "stoker/openapi/helpers";
import { zodSuccessResponse } from "#/lib/zod-helpers";
import {
  badRequestErrorSchema,
  forbiddenSchema,
  internalServerErrorSchema,
  tooManyRequestsSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";
import { z } from "zod";

const tags = ["Search"];

export const searchRoute = createAuthorizedRoute({
  tags,
  summary: "Search workspace documents",
  description:
    "Executes a hybrid search (BM25 + pgvector) across all document sections in the workspace.",
  method: "get",
  path: "/",
  rateLimit: standardApiRateLimit,
  authorization: {
    resource: "workspace",
    action: "view",
    mapInput: ({ params }) => ({
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
    }),
    query: searchRequestQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(searchResponseSchema),
      HttpStatusPhrases.OK,
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

export type SearchRoute = typeof searchRoute;
