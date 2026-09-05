import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import { workspaceId } from "@dotion/shared/workspaces/schema";
import {
  searchRequestQuerySchema,
  searchResponseSchema,
} from "@dotion/shared/search/schema";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { jsonContent } from "stoker/openapi/helpers";
import {
  badRequestErrorSchema,
  forbiddenSchema,
  internalServerErrorSchema,
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
      searchResponseSchema,
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
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export type SearchRoute = typeof searchRoute;
