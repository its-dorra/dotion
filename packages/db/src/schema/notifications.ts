import { snakeCase, text, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { createdAt, updatedAt, textId } from "../utils";
import { users } from "./auth";
import type { UserId } from "@dotion/shared/users/types";
import type {
  NotificationId,
  NotificationMetadata,
} from "@dotion/shared/notifications/types";

export const notifications = snakeCase.table(
  "notifications",
  {
    id: textId<NotificationId>(),
    userId: text()
      .$type<UserId>()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    metadata: jsonb("metadata").$type<NotificationMetadata>().notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("notifications_user_id_created_at_idx").on(t.userId, t.createdAt),
    index("notifications_user_id_is_read_idx").on(t.userId, t.isRead),
  ],
);
