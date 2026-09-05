import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import z from "zod";
import { workspaceId } from "@dotion/shared/workspaces/schema";
import { pageId } from "@dotion/shared/pages/schema";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import { zodSuccessResponse } from "#/lib/zod-helpers";
import {
  internalServerErrorSchema,
  unauthorizedSchema,
  forbiddenSchema,
  badRequestErrorSchema,
  notFoundErrorSchema,
} from "#/lib/http-response-helpers";
import {
  PaginationQuerySchema,
  createPaginatedDataSchema,
} from "@dotion/shared/pagination/schema";
import {
  commentId,
  CommentWithRepliesAndAuthorSchema,
  CreateCommentSchema,
} from "@dotion/shared/comments/schema";

const tags = ["Comments"];

export const listCommentsRoute = createAuthorizedRoute({
  tags,
  summary: "Get all comments for a page",
  method: "get",
  path: "/",
  authorization: {
    resource: "comment",
    action: "list",
    mapScope: ({ params }) => ({ pageId: params.pageId }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
    }),
    query: PaginationQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(
        createPaginatedDataSchema(CommentWithRepliesAndAuthorSchema),
      ),
      HttpStatusPhrases.OK,
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

export const createCommentRoute = createAuthorizedRoute({
  tags,
  summary: "Create a top-level comment or reply",
  method: "post",
  path: "/",
  authorization: {
    resource: "comment",
    action: "create",
    mapScope: ({ params }) => ({ pageId: params.pageId }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
    }),
    body: jsonContentRequired(
      CreateCommentSchema.pick({ body: true, parentId: true }).partial({
        parentId: true,
      }),
      "Comment payload",
    ),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      zodSuccessResponse(CommentWithRepliesAndAuthorSchema),
      HttpStatusPhrases.CREATED,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestErrorSchema,
      HttpStatusPhrases.BAD_REQUEST,
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundErrorSchema,
      HttpStatusPhrases.NOT_FOUND,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const resolveCommentRoute = createAuthorizedRoute({
  tags,
  summary: "Resolve a comment",
  method: "patch",
  path: "/{commentId}/resolve",
  authorization: {
    resource: "comment",
    action: "resolve",
    mapInput: ({ params }) => ({ commentId: params.commentId }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
      commentId: commentId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(z.null()),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestErrorSchema,
      HttpStatusPhrases.BAD_REQUEST,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export const deleteCommentRoute = createAuthorizedRoute({
  tags,
  summary: "Delete a comment or reply",
  method: "delete",
  path: "/{commentId}",
  authorization: {
    resource: "comment",
    action: "delete",
    mapInput: ({ params }) => ({ commentId: params.commentId }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
      commentId: commentId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      zodSuccessResponse(
        z.object({
          commentId,
          parentId: commentId.nullable(),
          isRoot: z.boolean(),
        }),
      ),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
    ),
    [HttpStatusCodes.BAD_REQUEST]: jsonContent(
      badRequestErrorSchema,
      HttpStatusPhrases.BAD_REQUEST,
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(
      notFoundErrorSchema,
      HttpStatusPhrases.NOT_FOUND,
    ),
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export type ListCommentsRoute = typeof listCommentsRoute;
export type CreateCommentRoute = typeof createCommentRoute;
export type ResolveCommentRoute = typeof resolveCommentRoute;
export type DeleteCommentRoute = typeof deleteCommentRoute;
