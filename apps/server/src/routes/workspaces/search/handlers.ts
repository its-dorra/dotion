import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "#/lib/types";
import { errorResponseJson } from "#/lib/utils";
import type { SearchRoute } from "./routes";

export const searchHandler: AppRouteHandler<SearchRoute> = async (c) => {
  const { id: workspaceId } = c.req.valid("param");
  const { q, limit } = c.req.valid("query");

  const result = await c.var.services.search.hybridSearch({
    workspaceId,
    query: q,
    limit,
  });

  if (result.isErr()) {
    console.error("Search error:", result.error);
    return c.json(
      errorResponseJson("Failed to execute search"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  return c.json({ items: result.value }, HttpStatusCodes.OK);
};
