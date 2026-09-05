import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import {
  badRequestErrorSchema,
  forbiddenSchema,
  internalServerErrorSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";
import { jsonContent } from "stoker/openapi/helpers";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { zodSuccessResponse } from "#/lib/zod-helpers";
import {
  UserSearchQuerySchema,
  PaginatedUserSearchResultsDataSchema,
} from "@dotion/shared/users/schema";

const tags = ["users"];

export const searchRoute = createAuthorizedRoute({
  tags,
  summary: "Search users by name or email",
  description:
    "Returns paginated user search results, excluding workspace members if workspaceId is provided.",
  method: "get",
  path: "/search",
  authorization: {
    resource: "user",
    action: "list",
  },
  request: {
    query: UserSearchQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(PaginatedUserSearchResultsDataSchema),
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
