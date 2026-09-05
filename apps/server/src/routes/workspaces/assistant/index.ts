import { createRoute } from "#/lib/create-app";
import {
  listThreadsRoute,
  createThreadRoute,
  deleteThreadRoute,
  listMessagesRoute,
  streamAssistantChatRoute,
} from "./routes";
import {
  listThreadsHandler,
  createThreadHandler,
  deleteThreadHandler,
  listMessagesHandler,
  streamAssistantChatHandler,
} from "./handlers";

const router = createRoute()
  .openapi(listThreadsRoute, listThreadsHandler)
  .openapi(createThreadRoute, createThreadHandler)
  .openapi(deleteThreadRoute, deleteThreadHandler)
  .openapi(listMessagesRoute, listMessagesHandler)
  .openapi(streamAssistantChatRoute, streamAssistantChatHandler);

export default router;
