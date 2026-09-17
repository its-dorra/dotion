import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "#/lib/types";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import type { SearchRoute } from "./routes";

export const searchHandler: AppRouteHandler<SearchRoute> = async (c) => {
  const { id: workspaceId } = c.req.valid("param");
  const { q, page, limit, mode } = c.req.valid("query");

  const result = await c.var.services.search.hybridSearch({
    workspaceId,
    query: q,
    page,
    limit,
    mode,
  });

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to execute search"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      EmbeddingError: () =>
        c.json(
          errorResponseJson("Failed to generate query embedding"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};
