import type { z } from "zod";
import type {
  assistantCitationSchema,
  assistantToolCallSchema,
  assistantThreadSchema,
  createThreadRequestSchema,
  assistantMessageSchema,
  createAssistantMessageSchema,
  sendAssistantMessageRequestSchema,
  listPaginationQuerySchema,
  paginatedThreadsResponseSchema,
  paginatedMessagesResponseSchema,
} from "./schema";
import type {
  SearchWorkspaceInput,
  SearchWorkspaceHit,
  SearchWorkspaceOutput,
  ReadFullPageInput,
  ReadFullPageOutput,
  GetPageTreeInput,
  PageTreeItem,
  GetPageTreeOutput,
  FetchAdjacentSectionsInput,
  AdjacentSectionHit,
  FetchAdjacentSectionsOutput,
  GetPageBlocksInput,
  StructuredBlock,
  GetPageBlocksOutput,
  AssistantTools,
  UITools,
  ChatMessage,
  ToolPart,
} from "./tools";

export type AssistantCitation = z.infer<typeof assistantCitationSchema>;
export type AssistantToolCall = z.infer<typeof assistantToolCallSchema>;
export type AssistantThread = z.infer<typeof assistantThreadSchema>;
export type CreateThreadRequest = z.infer<typeof createThreadRequestSchema>;
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;
export type CreateAssistantMessage = z.infer<
  typeof createAssistantMessageSchema
>;

export type SendAssistantMessageRequest = z.infer<
  typeof sendAssistantMessageRequestSchema
>;
export type ListPaginationQuery = z.infer<typeof listPaginationQuerySchema>;
export type PaginatedThreadsResponse = z.infer<
  typeof paginatedThreadsResponseSchema
>;
export type PaginatedMessagesResponse = z.infer<
  typeof paginatedMessagesResponseSchema
>;

import type { UIMessage } from "ai";
import type { WorkspaceId } from "../workspaces/types";
import type { UserId } from "../users/types";
import type { AssistantThreadId } from "../ids";

export interface StreamChatInput {
  workspaceId: WorkspaceId;
  threadId: AssistantThreadId;
  userId: UserId;
  workspaceName?: string;
  messages: UIMessage[];
  onBackgroundWork?: (promise: Promise<unknown>) => void;
}

export type {
  SearchWorkspaceInput,
  SearchWorkspaceHit,
  SearchWorkspaceOutput,
  ReadFullPageInput,
  ReadFullPageOutput,
  GetPageTreeInput,
  PageTreeItem,
  GetPageTreeOutput,
  FetchAdjacentSectionsInput,
  AdjacentSectionHit,
  FetchAdjacentSectionsOutput,
  GetPageBlocksInput,
  StructuredBlock,
  GetPageBlocksOutput,
  AssistantTools,
  UITools,
  ChatMessage,
  ToolPart,
};
