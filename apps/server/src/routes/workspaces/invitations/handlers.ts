import type { AppRouteHandler } from "#/lib/types";
import type {
  InviteMemberRoute,
  ListWorkspaceInvitationsRoute,
  CancelWorkspaceInvitationRoute,
  AcceptInvitationRoute,
  DeclineInvitationRoute,
} from "./routes";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";

export const inviteMemberHandler: AppRouteHandler<InviteMemberRoute> = async (
  c,
) => {
  const currentUser = c.var.currentUser;
  const { id } = c.req.valid("param");
  const input = c.req.valid("json");

  const result = await c.var.services.workspaces.inviteMember(
    id,
    currentUser.id,
    input,
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
          errorResponseJson(HttpStatusPhrases.NOT_FOUND),
          HttpStatusCodes.NOT_FOUND,
        ),
      UniqueConstraintViolationError: () =>
        c.json(
          errorResponseJson("User is already invited or a member"),
          HttpStatusCodes.BAD_REQUEST,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.CREATED);
};

export const listWorkspaceInvitationsHandler: AppRouteHandler<
  ListWorkspaceInvitationsRoute
> = async (c) => {
  const { id } = c.req.valid("param");
  const pagination = c.req.valid("query");

  const result = await c.var.services.workspaces.getWorkspaceInvitations(
    id,
    pagination,
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
          errorResponseJson(HttpStatusPhrases.NOT_FOUND),
          HttpStatusCodes.NOT_FOUND,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const cancelWorkspaceInvitationHandler: AppRouteHandler<
  CancelWorkspaceInvitationRoute
> = async (c) => {
  const { id, invitationId } = c.req.valid("param");

  const result = await c.var.services.workspaces.cancelInvitation(
    id,
    invitationId,
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
          errorResponseJson(HttpStatusPhrases.NOT_FOUND),
          HttpStatusCodes.NOT_FOUND,
        ),
    });
  }

  return c.json(
    successResponseJson({ success: true as const }),
    HttpStatusCodes.OK,
  );
};

export const acceptInvitationHandler: AppRouteHandler<
  AcceptInvitationRoute
> = async (c) => {
  const currentUser = c.var.currentUser;
  const { invitationId } = c.req.valid("param");

  const result = await c.var.services.workspaces.acceptInvitation(
    invitationId,
    currentUser.id,
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
          errorResponseJson(HttpStatusPhrases.NOT_FOUND),
          HttpStatusCodes.NOT_FOUND,
        ),
      UniqueConstraintViolationError: () =>
        c.json(
          errorResponseJson("You are already a member of this workspace"),
          HttpStatusCodes.BAD_REQUEST,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const declineInvitationHandler: AppRouteHandler<
  DeclineInvitationRoute
> = async (c) => {
  const currentUser = c.var.currentUser;
  const { invitationId } = c.req.valid("param");

  const result = await c.var.services.workspaces.declineInvitation(
    invitationId,
    currentUser.id,
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
          errorResponseJson(HttpStatusPhrases.NOT_FOUND),
          HttpStatusCodes.NOT_FOUND,
        ),
    });
  }

  return c.json(
    successResponseJson({ success: true as const }),
    HttpStatusCodes.OK,
  );
};
