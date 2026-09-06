import {
  snakeCase,
  text,
  boolean,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { pages } from "./pages";
import { users } from "./auth";
import { createdAt, updatedAt, textId } from "../utils";
import type { PageId } from "@dotion/shared/pages/types";
import type { UserId } from "@dotion/shared/users/types";
import type { CommentId } from "@dotion/shared/comments/types";

export const comments = snakeCase.table(
  "comments",
  {
    id: textId<CommentId>(),
    pageId: text()
      .$type<PageId>()
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    authorId: text()
      .$type<UserId>()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: text()
      .$type<CommentId>()
      .references((): AnyPgColumn => comments.id, { onDelete: "cascade" }),
    body: text().notNull(),
    isResolved: boolean().notNull().default(false),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("comments_page_id_parent_id_created_at_idx").on(
      t.pageId,
      t.parentId,
      t.createdAt,
    ),
    index("comments_parent_id_created_at_idx").on(t.parentId, t.createdAt),
    index("comments_author_id_idx").on(t.authorId),
  ],
);
