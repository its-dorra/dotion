import type { UIMessage, ModelMessage } from "ai";
import type { UserId } from "../users/types";
import type { WorkspaceId } from "../workspaces/types";
import type { AssistantCitation, ToolPart } from "../assistant/types";

export interface AIUsageMetrics {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

import { DEFAULT_GEMINI_MODEL } from "./constants";
export { DEFAULT_GEMINI_MODEL };

export type WorkspaceToolResult<T extends Record<string, unknown>> = {
  error?: string;
} & T;

export type BlockNoteToolDefinitions = Record<string, any>;

export interface StreamEditorAIInput {
  userId: UserId;
  workspaceId?: WorkspaceId;
  messages: UIMessage[];
  toolDefinitions: BlockNoteToolDefinitions;
  onBackgroundWork?: (promise: Promise<unknown>) => void;
}

export interface StreamRAGInput {
  userId: UserId;
  workspaceId: WorkspaceId;
  messages: ModelMessage[];
  maxSteps?: number;
  onCitationCollected?: (citation: AssistantCitation) => void;
  onFinish?: (
    text: string,
    usage: AIUsageMetrics,
    citations: AssistantCitation[],
    toolCalls: ToolPart[],
  ) => Promise<void> | void;
  onBackgroundWork?: (promise: Promise<unknown>) => void;
}

export type EmbeddingTaskType =
  | "RETRIEVAL_QUERY"
  | "RETRIEVAL_DOCUMENT"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING"
  | "QUESTION_ANSWERING"
  | "FACT_VERIFICATION";
