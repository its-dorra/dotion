import {
  snakeCase,
  foreignKey,
  primaryKey,
  text,
  boolean,
  bytea,
} from "drizzle-orm/pg-core";
import { workspaceMembers, workspaces } from "./workspaces";
import { createdAt, updatedAt, textId } from "../utils";
import type { WorkspaceId } from "@dotion/shared/workspaces/types";
import type { UserId } from "@dotion/shared/users/types";
import type { PageId } from "@dotion/shared/pages/types";
import {
  PAGE_PERMISSION_ROLES,
  PAGE_ACCESS_REQUEST_STATUSES,
} from "@dotion/shared/pages/constants";

export const pages = snakeCase.table(
  "pages",
  {
    id: textId<PageId>(),
    title: text().notNull(),
    icon: text(),
    cover: text(),
    content: bytea(),
    workspaceId: text()
      .$type<WorkspaceId>()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    parentId: text().$type<PageId>(),
    inTrash: boolean().notNull().default(false),
    createdAt,
    updatedAt,
  },
  (t) => [
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete("set null"),
  ],
);

export const pagePermissions = snakeCase.table(
  "page_permissions",
  {
    pageId: text()
      .notNull()
      .$type<PageId>()
      .references(() => pages.id, { onDelete: "cascade" }),
    userId: text().$type<UserId>().notNull(),
    workspaceId: text().$type<WorkspaceId>().notNull(),
    role: text({ enum: PAGE_PERMISSION_ROLES }).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    primaryKey({ columns: [t.pageId, t.userId, t.workspaceId] }),
    foreignKey({
      columns: [t.workspaceId, t.userId],
      foreignColumns: [workspaceMembers.workspaceId, workspaceMembers.userId],
    }).onDelete("cascade"),
  ],
);

export const pageAccessRequests = snakeCase.table(
  "page_access_requests",
  {
    id: textId<string>(),
    pageId: text()
      .notNull()
      .$type<PageId>()
      .references(() => pages.id, { onDelete: "cascade" }),
    workspaceId: text()
      .notNull()
      .$type<WorkspaceId>()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text().$type<UserId>().notNull(),
    requestedRole: text({ enum: PAGE_PERMISSION_ROLES }).notNull(),
    status: text({ enum: PAGE_ACCESS_REQUEST_STATUSES })
      .notNull()
      .default("pending"),
    createdAt,
    updatedAt,
  },
  (t) => [
    foreignKey({
      columns: [t.workspaceId, t.userId],
      foreignColumns: [workspaceMembers.workspaceId, workspaceMembers.userId],
    }).onDelete("cascade"),
  ],
);
