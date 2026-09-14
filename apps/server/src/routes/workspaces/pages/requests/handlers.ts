import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "#/lib/types";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import type {
  CreateRequestRoute,
  GetRequestStatusRoute,
  ApproveRequestRoute,
  RejectRequestRoute,
} from "./routes";

export const createRequestHandler: AppRouteHandler<CreateRequestRoute> = async (
  c,
) => {
  const currentUser = c.var.currentUser;
  const { id: workspaceId, pageId } = c.req.valid("param");
  const { requestedRole } = c.req.valid("json");

  const result = await c.var.services.pages.createAccessRequest({
    workspaceId,
    pageId,
    requester: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
    },
    requestedRole,
  });

  if (result.isErr()) {
    return result.error.match({
      NotFoundError: () =>
        c.json(
          errorResponseJson("Workspace or page not found"),
          HttpStatusCodes.NOT_FOUND,
        ),
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to create access request"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.CREATED);
};

export const getRequestStatusHandler: AppRouteHandler<
  GetRequestStatusRoute
> = async (c) => {
  const currentUser = c.var.currentUser;
  const { pageId } = c.req.valid("param");

  const result = await c.var.services.pages.getAccessRequestStatus({
    pageId,
    userId: currentUser.id,
  });

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to get access request status"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const approveRequestHandler: AppRouteHandler<
  ApproveRequestRoute
> = async (c) => {
  const currentUser = c.var.currentUser;
  const { id: workspaceId, pageId, requestId } = c.req.valid("param");

  const result = await c.var.services.pages.approveAccessRequest({
    workspaceId,
    pageId,
    requestId,
    approver: { id: currentUser.id, name: currentUser.name },
  });

  if (result.isErr()) {
    return result.error.match({
      NotFoundError: () =>
        c.json(
          errorResponseJson("Access request not found"),
          HttpStatusCodes.NOT_FOUND,
        ),
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to approve access request"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const rejectRequestHandler: AppRouteHandler<RejectRequestRoute> = async (
  c,
) => {
  const currentUser = c.var.currentUser;
  const { id: workspaceId, pageId, requestId } = c.req.valid("param");

  const result = await c.var.services.pages.rejectAccessRequest({
    workspaceId,
    pageId,
    requestId,
    rejecter: { id: currentUser.id, name: currentUser.name },
  });

  if (result.isErr()) {
    return result.error.match({
      NotFoundError: () =>
        c.json(
          errorResponseJson("Access request not found"),
          HttpStatusCodes.NOT_FOUND,
        ),
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to reject access request"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};
