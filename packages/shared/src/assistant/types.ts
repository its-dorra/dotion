import type { z } from "zod";
import type {
  assistantCitationSchema,
  assistantThreadSchema,
  assistantMessageSchema,
  createThreadRequestSchema,
  sendAssistantMessageRequestSchema,
  listPaginationQuerySchema,
  paginatedThreadsResponseSchema,
  paginatedMessagesResponseSchema,
} from "./schema";
import type {
  AssistantToolName,
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
export type AssistantThread = z.infer<typeof assistantThreadSchema>;
export type AssistantMessage = z.infer<typeof assistantMessageSchema>;
export type CreateThreadRequest = z.infer<typeof createThreadRequestSchema>;
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

export type {
  AssistantToolName,
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
