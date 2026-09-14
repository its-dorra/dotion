import type { AppRouteHandler } from "#/lib/types";
import { errorResponseJson, successResponseJson } from "#/lib/utils";
import * as HttpStatusCodes from "stoker/http-status-codes";
import type {
  CreateCommentRoute,
  DeleteCommentRoute,
  ListCommentsRoute,
  ResolveCommentRoute,
} from "./routes";

export const listCommentsHandler: AppRouteHandler<ListCommentsRoute> = async (
  c,
) => {
  const { pageId } = c.req.valid("param");
  const query = c.req.valid("query");

  const result = await c.var.services.comments.getPageComments({
    pageId,
    pagination: query,
  });
  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to fetch comments"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(successResponseJson(result.value), HttpStatusCodes.OK);
};

export const createCommentHandler: AppRouteHandler<CreateCommentRoute> = async (
  c,
) => {
  try {
    const { pageId } = c.req.valid("param");
    const body = c.req.valid("json");
    const currentUser = c.var.currentUser;

    const result = await c.var.services.comments.createComment({
      userId: currentUser.id,
      pageId,
      body: body.body,
      parentId: body.parentId ?? null,
    });

    if (result.isErr()) {
      return result.error.match({
        DatabaseError: () =>
          c.json(
            errorResponseJson("Failed to create comment"),
            HttpStatusCodes.INTERNAL_SERVER_ERROR,
          ),
        NotFoundError: () =>
          c.json(
            errorResponseJson("Parent comment not found"),
            HttpStatusCodes.NOT_FOUND,
          ),
      });
    }

    const comment = result.value;

    return c.json(successResponseJson(comment), HttpStatusCodes.CREATED);
  } catch (e) {
    console.error("Error creating comment:", e);
    return c.json(
      errorResponseJson("Failed to create comment"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
};

export const resolveCommentHandler: AppRouteHandler<
  ResolveCommentRoute
> = async (c) => {
  const { pageId, commentId } = c.req.valid("param");

  const result = await c.var.services.comments.resolveComment({
    pageId,
    commentId,
  });
  if (result.isErr()) {
    return c.json(
      errorResponseJson("Failed to resolve comment"),
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  return c.json(successResponseJson(null), HttpStatusCodes.OK);
};

export const deleteCommentHandler: AppRouteHandler<DeleteCommentRoute> = async (
  c,
) => {
  const { pageId, commentId } = c.req.valid("param");

  const result = await c.var.services.comments.deleteComment({
    pageId,
    commentId,
  });
  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to delete comment"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      NotFoundError: () =>
        c.json(
          errorResponseJson("Comment not found"),
          HttpStatusCodes.NOT_FOUND,
        ),
    });
  }

  const { parentId, isRoot } = result.value;

  return c.json(
    successResponseJson({ commentId, parentId, isRoot }),
    HttpStatusCodes.OK,
  );
};
