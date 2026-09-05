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
import { workspaceId } from "@dotion/shared/workspaces/schema";
import { PaginationQuerySchema } from "@dotion/shared/pagination/schema";
import { PaginatedUserSearchResultsDataSchema } from "@dotion/shared/users/schema";
import z from "zod";

const tags = ["workspaces"];

export const CandidateUsersQuerySchema = PaginationQuerySchema.extend({
  q: z.string().min(1),
});

export const candidateUsersRoute = createAuthorizedRoute({
  tags,
  summary: "Search candidate users to invite to the workspace",
  description:
    "Returns paginated user search results excluding existing workspace members and pending invitees.",
  method: "get",
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
    query: CandidateUsersQuerySchema,
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

export type CandidateUsersRoute = typeof candidateUsersRoute;
