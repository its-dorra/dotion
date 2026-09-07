import { createAuthorizedRoute } from "#/lib/create-authorized-route";
import { workspaceId } from "@dotion/shared/workspaces/schema";
import { pageId } from "@dotion/shared/pages/schema";
import * as HttpStatusCodes from "stoker/http-status-codes";
import * as HttpStatusPhrases from "stoker/http-status-phrases";
import { jsonContent, jsonContentRequired } from "stoker/openapi/helpers";
import {
  badRequestErrorSchema,
  forbiddenSchema,
  internalServerErrorSchema,
  unauthorizedSchema,
} from "#/lib/http-response-helpers";
import type { BlockNoteToolDefinitions } from "@dotion/services";
import type { UIMessage } from "ai";
import { z } from "@hono/zod-openapi";

const tags = ["AI"];

export const StreamTextRequestSchema = z.object({
  messages: z
    .custom<UIMessage[]>(
      (val) => Array.isArray(val),
      "Must be an array of chat messages",
    )
    .openapi({
      type: "array",
      description: "AI SDK messages",
    })
    .describe("List of chat messages from BlockNote AI"),
  toolDefinitions: z
    .custom<BlockNoteToolDefinitions>(
      (val) => typeof val === "object" && val !== null,
      "Must be a tool definitions map",
    )
    .openapi({
      type: "object",
      description: "Blocknote tool definitions",
    })
    .describe(
      "Client-side tool definitions for BlockNote document manipulation",
    ),
});

export const TooManyRequestsErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  resetAt: z.number(),
});

export const streamTextRoute = createAuthorizedRoute({
  tags,
  summary: "Stream AI assistance for BlockNote editor",
  description:
    "Handles streaming AI interactions for editing and generating BlockNote content with token quota management.",
  method: "post",
  path: "/streamText",
  authorization: {
    resource: "page",
    action: "update",
    mapInput: ({ params }) => ({
      pageId: params.pageId,
      workspaceId: params.id,
    }),
  },
  request: {
    params: z.object({
      id: workspaceId,
      pageId: pageId,
    }),
    body: jsonContentRequired(
      StreamTextRequestSchema,
      "The AI prompt messages and tool definitions",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      description: "AI streaming response",
    },
    [HttpStatusCodes.TOO_MANY_REQUESTS]: jsonContent(
      TooManyRequestsErrorSchema,
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
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
      internalServerErrorSchema,
      HttpStatusPhrases.INTERNAL_SERVER_ERROR,
    ),
  },
});

export type StreamTextRoute = typeof streamTextRoute;
