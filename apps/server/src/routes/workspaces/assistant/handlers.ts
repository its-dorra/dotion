import * as HttpStatusCodes from "stoker/http-status-codes";
import type { AppRouteHandler } from "#/lib/types";
import { errorResponseJson } from "#/lib/utils";
import type {
  ListThreadsRoute,
  CreateThreadRoute,
  DeleteThreadRoute,
  ListMessagesRoute,
  StreamAssistantChatRoute,
} from "./routes";

export const listThreadsHandler: AppRouteHandler<ListThreadsRoute> = async (
  c,
) => {
  const currentUser = c.var.currentUser;
  const { id: workspaceId } = c.req.valid("param");
  const query = c.req.valid("query");

  const result = await c.var.services.assistant.listThreads(
    workspaceId,
    currentUser.id,
    query,
  );

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to list assistant threads"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(result.value, HttpStatusCodes.OK);
};

export const createThreadHandler: AppRouteHandler<CreateThreadRoute> = async (
  c,
) => {
  const currentUser = c.var.currentUser;
  const { id: workspaceId } = c.req.valid("param");
  const { title } = c.req.valid("json");

  const result = await c.var.services.assistant.createThread(
    workspaceId,
    currentUser.id,
    title,
  );

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to create assistant thread"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(result.value, HttpStatusCodes.CREATED);
};

export const deleteThreadHandler: AppRouteHandler<DeleteThreadRoute> = async (
  c,
) => {
  const { threadId } = c.req.valid("param");

  const result = await c.var.services.assistant.deleteThread(threadId);

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to delete assistant thread"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json({ success: true as const }, HttpStatusCodes.OK);
};

export const listMessagesHandler: AppRouteHandler<ListMessagesRoute> = async (
  c,
) => {
  const { threadId } = c.req.valid("param");
  const query = c.req.valid("query");

  const result = await c.var.services.assistant.listMessages(threadId, query);

  if (result.isErr()) {
    return result.error.match({
      DatabaseError: () =>
        c.json(
          errorResponseJson("Failed to list thread messages"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return c.json(result.value, HttpStatusCodes.OK);
};

export const streamAssistantChatHandler: AppRouteHandler<
  StreamAssistantChatRoute
> = async (c) => {
  const currentUser = c.var.currentUser;
  const { id: workspaceId, threadId } = c.req.valid("param");
  const { content } = c.req.valid("json");

  const result = await c.var.services.assistant.streamChat({
    workspaceId,
    threadId,
    userId: currentUser.id,
    content,
  });

  if (result.isErr()) {
    console.error("Error in Assistant stream chat:", result.error);
    return result.error.match({
      QuotaExceededError: (err) =>
        c.json(
          {
            success: false as const,
            error: err.message,
            resetAt: err.resetAt,
          },
          HttpStatusCodes.TOO_MANY_REQUESTS,
        ),
      NotFoundError: () =>
        c.json(
          errorResponseJson("Assistant thread not found"),
          HttpStatusCodes.NOT_FOUND,
        ),
      DatabaseError: () =>
        c.json(
          errorResponseJson("Database error while processing assistant chat"),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
      AIError: (err) =>
        c.json(
          errorResponseJson(err.message),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return result.value.toUIMessageStreamResponse();
};
