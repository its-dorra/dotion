import type { AppRouteHandler } from "#/lib/types";
import type { CandidateUsersRoute } from "./routes";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

export const candidateUsersHandler: AppRouteHandler<
  CandidateUsersRoute
> = async (c) => {
  const { id: workspaceId } = c.req.valid("param");
  const { q, page, limit } = c.req.valid("query");

  const pagination = { page, limit };

  const result = await c.var.services.workspaces.searchCandidateUsers({
    workspaceId,
    query: q,
    pagination,
  });

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};
