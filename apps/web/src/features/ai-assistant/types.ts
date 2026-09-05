import type {
  AssistantThread,
  AssistantMessage,
  AssistantCitation,
  PaginatedThreadsResponse,
  PaginatedMessagesResponse,
  CreateThreadRequest,
  SendAssistantMessageRequest,
} from '@dotion/shared/assistant/types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { AssistantThreadId, AssistantMessageId } from '@dotion/shared/ids'

export type {
  AssistantThread,
  AssistantMessage,
  AssistantCitation,
  PaginatedThreadsResponse,
  PaginatedMessagesResponse,
  CreateThreadRequest,
  SendAssistantMessageRequest,
  WorkspaceId,
  AssistantThreadId,
  AssistantMessageId,
}

export interface StreamChatOptions {
  onChunk?: (textDelta: string) => void
  onFinish?: (fullText: string) => void
  onError?: (error: Error) => void
  signal?: AbortSignal
}
