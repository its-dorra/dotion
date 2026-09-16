import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import { standardApiRateLimit } from "#/middlewares/rate-limit-middleware";
import { workspaceId, assistantThreadId } from "@dotion/shared/ids";
import {
  assistantThreadSchema,
  sendAssistantMessageRequestSchema,
  listPaginationQuerySchema,
  paginatedThreadsResponseSchema,
  paginatedMessagesResponseSchema,
} from "@dotion/shared/assistant/schema";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import {
  badRequestErrorSchema,
  forbiddenSchema,
  internalServerErrorSchema,
  notFoundErrorSchema,
  tooManyRequestsSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";
import { z } from "zod";

const tags = ["AI Assistant"];

export const listThreadsRoute = createAuthorizedRoute({
  tags,
  summary: "List assistant chat threads",
  description:
    "Fetches user's conversation threads in this workspace with cursor pagination.",
  method: "get",
  path: "/threads",
  rateLimit: standardApiRateLimit,
  authorization: {
    resource: "workspace",
    action: "view",
    mapInput: ({ params }) => ({
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
    }),
    query: listPaginationQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      paginatedThreadsResponseSchema,
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
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

export const createThreadRoute = createAuthorizedRoute({
  tags,
  summary: "Create assistant chat thread",
  description: "Creates a new conversation thread for the current user.",
  method: "post",
  path: "/threads",
  rateLimit: standardApiRateLimit,
  authorization: {
    resource: "workspace",
    action: "view",
    mapInput: ({ params }) => ({
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
    }),
  },
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      assistantThreadSchema,
      HttpStatusPhrases.CREATED,
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
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

export const deleteThreadRoute = createAuthorizedRoute({
  tags,
  summary: "Delete assistant chat thread",
  description: "Deletes a conversation thread and all its messages.",
  method: "delete",
  path: "/threads/:threadId",
  rateLimit: standardApiRateLimit,
  authorization: {
    resource: "workspace",
    action: "view",
    mapInput: ({ params }) => ({
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      threadId: assistantThreadId,
    }),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ success: z.literal(true) }),
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
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

export const listMessagesRoute = createAuthorizedRoute({
  tags,
  summary: "List thread messages",
  description: "Fetches paginated messages for a conversation thread.",
  method: "get",
  path: "/threads/:threadId/messages",
  rateLimit: standardApiRateLimit,
  authorization: {
    resource: "workspace",
    action: "view",
    mapInput: ({ params }) => ({
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      threadId: assistantThreadId,
    }),
    query: listPaginationQuerySchema,
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      paginatedMessagesResponseSchema,
      HttpStatusPhrases.OK,
    ),
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      unauthorizedSchema,
      HttpStatusPhrases.UNAUTHORIZED,
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      forbiddenSchema,
      HttpStatusPhrases.FORBIDDEN,
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

export const streamAssistantChatRoute = createAuthorizedRoute({
  tags,
  summary: "Stream assistant RAG response",
  description:
    "Sends a prompt, executes RAG retrieval, and streams the answer with citations.",
  method: "post",
  path: "/threads/:threadId/chat",
  rateLimit: {
    limiter: (env) => env.AI_RATE_LIMITER,
    keyGenerator: (c) => `ai:${c.var.currentUser.id}`,
    errorMessage: "Too many AI requests. Please slow down.",
  },
  authorization: {
    resource: "workspace",
    action: "view",
    mapInput: ({ params }) => ({
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      threadId: assistantThreadId,
    }),
    body: jsonContentRequired(
      sendAssistantMessageRequestSchema,
      "User message content",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description: "AI streaming response",
    },
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      HttpStatusPhrases.TOO_MANY_REQUESTS,
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

export type ListThreadsRoute = typeof listThreadsRoute;
export type CreateThreadRoute = typeof createThreadRoute;
export type DeleteThreadRoute = typeof deleteThreadRoute;
export type ListMessagesRoute = typeof listMessagesRoute;
export type StreamAssistantChatRoute = typeof streamAssistantChatRoute;
