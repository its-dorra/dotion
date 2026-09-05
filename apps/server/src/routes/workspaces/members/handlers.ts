import type { AppRouteHandler } from "#/lib/types";
import type {
  ListMembersRoute,
  UpdateMemberRoleRoute,
  RemoveMemberRoute,
} from "./routes";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import * as HttpStatusCodes from "stoker/http-status-codes";

import * as HttpStatusPhrases from "stoker/http-status-phrases";

export const listMembersHandler: AppRouteHandler<ListMembersRoute> = async (
  c,
) => {
  const { id } = c.req.valid("param");
  const pagination = c.req.valid("query");

  const result = await c.var.services.workspaces.getMembers(id, pagination);

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      NotFoundError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.NOT_FOUND),
          HttpStatusCodes.NOT_FOUND,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const updateMemberRoleHandler: AppRouteHandler<
  UpdateMemberRoleRoute
> = async (c) => {
  const { id, memberId } = c.req.valid("param");
  const { role } = c.req.valid("json");

  const result = await c.var.services.workspaces.updateMemberRole(
    id,
    memberId,
    role,
  );

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      NotFoundError: () =>
        c.json(
          errorResponseJson("Member not found"),
          HttpStatusCodes.NOT_FOUND,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const removeMemberHandler: AppRouteHandler<RemoveMemberRoute> = async (
  c,
) => {
  const { id, memberId } = c.req.valid("param");

  const result = await c.var.services.workspaces.removeMember(id, memberId);

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson(HttpStatusPhrases.INTERNAL_SERVER_ERROR),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      NotFoundError: () =>
        c.json(
          errorResponseJson("Member not found"),
          HttpStatusCodes.NOT_FOUND,
        ),
    });
  }

  return c.json(
    successResponseJson({ success: true as const }),
    HttpStatusCodes.OK,
  );
};
