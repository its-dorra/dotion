import * as HttpStatusCodes from "stoker/http-status-codes";
import { createUIMessageStreamResponse, toUIMessageStream } from "ai";
import type { AppRouteHandler } from "#/lib/types";
import { errorResponseJson } from "#/lib/utils";
import type { StreamTextRoute } from "./routes";

export const streamTextHandler: AppRouteHandler<StreamTextRoute> = async (
  c,
) => {
  const currentUser = c.var.currentUser;
  const { id: workspaceId } = c.req.valid("param");
  const { messages, toolDefinitions } = c.req.valid("json");

  const result = await c.var.services.ai.streamEditorAI({
    userId: currentUser.id,
    workspaceId,
    messages,
    toolDefinitions,
    onBackgroundWork: c.executionCtx.waitUntil,
  });

  if (result.isErr()) {
    console.error("Error in AI stream generation:", result.error);
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
      AIError: (err) =>
        c.json(
          errorResponseJson(err.message),
          HttpStatusCodes.INTERNAL_SERVER_ERROR,
        ),
    });
  }

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.value.stream }),
  });
};
