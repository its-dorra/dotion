import {
  snakeCase,
  text,
  integer,
  jsonb,
  vector,
  index,
} from "drizzle-orm/pg-core";
import { pages } from "./pages";
import { workspaces } from "./workspaces";
import { createdAt, updatedAt, textId } from "../utils";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { PageId } from "@dotion/shared/pages/types";
import type { PageSectionId } from "@dotion/shared/ids";

export const pageSections = snakeCase.table(
  "page_sections",
  {
    id: textId<PageSectionId>(),
    workspaceId: text()
      .$type<WorkspaceId>()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    pageId: text()
      .$type<PageId>()
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    sectionIndex: integer().notNull(),
    sectionTitle: text().notNull(),
    headingBlockId: text().notNull(),
    blockIds: jsonb().$type<string[]>().notNull(),
    content: text().notNull(),
    contentHash: text().notNull(),
    embedding: vector({ dimensions: 768 }).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("idx_page_sections_embedding_hnsw").using(
      "hnsw",
      t.embedding.op("vector_cosine_ops"),
    ),
    index("idx_page_sections_workspace_id").on(t.workspaceId),
    index("idx_page_sections_page_id").on(t.pageId),
  ],
);
