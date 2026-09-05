import { snakeCase, text, integer, jsonb, index } from "drizzle-orm/pg-core";
import { workspaces } from "./workspaces";
import { users } from "./auth";
import { createdAt, updatedAt, textId } from "../utils";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserId } from "@dotion/shared/users/types";
import type {
  AssistantThreadId,
  AssistantMessageId,
  PageId,
} from "@dotion/shared/ids";

export interface AssistantCitation {
  pageId: PageId;
  pageTitle: string;
  sectionTitle: string;
  headingBlockId: string;
}

export const assistantThreads = snakeCase.table(
  "assistant_threads",
  {
    id: textId<AssistantThreadId>(),
    workspaceId: text()
      .$type<WorkspaceId>()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text()
      .$type<UserId>()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text().notNull().default("New Chat"),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("idx_assistant_threads_pagination").on(
      t.workspaceId,
      t.userId,
      t.updatedAt,
      t.id,
    ),
  ],
);

export const assistantMessages = snakeCase.table(
  "assistant_messages",
  {
    id: textId<AssistantMessageId>(),
    threadId: text()
      .$type<AssistantThreadId>()
      .notNull()
      .references(() => assistantThreads.id, { onDelete: "cascade" }),
    role: text({ enum: ["user", "assistant", "system"] }).notNull(),
    content: text().notNull(),
    citations: jsonb().$type<AssistantCitation[]>(),
    tokensUsed: integer().default(0).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("idx_assistant_messages_pagination").on(
      t.threadId,
      t.createdAt,
      t.id,
    ),
  ],
);
