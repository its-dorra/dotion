import {
  foreignKey,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { workspaceMembers, workspaces } from "./workspaces";
import { createdAt, updatedAt, uuidId } from "../utils";
import { relations } from "drizzle-orm/relations";

export const pages = pgTable(
  "pages",
  {
    id: uuidId("id"),
    title: text("title").notNull(),
    icon: text("icon"),
    cover: text("cover"),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    // version: integer("version").notNull().default(1),
    content: jsonb("content").notNull().default("{}"),
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

export const pagePermissions = pgTable(
  "page_permissions",
  {
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    workspaceMemberId: uuid("workspace_member_id")
      .notNull()
      .references(() => workspaceMembers.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "editor", "viewer"] }).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [primaryKey({ columns: [t.pageId, t.workspaceMemberId] })],
);

export const pagesRelations = relations(pages, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [pages.workspaceId],
    references: [workspaces.id],
  }),
  parent: one(pages, {
    fields: [pages.parentId],
    references: [pages.id],
  }),
  pagePermissions: many(pagePermissions),
}));

export const pagePermissionsRelations = relations(
  pagePermissions,
  ({ one }) => ({
    page: one(pages, {
      fields: [pagePermissions.pageId],
      references: [pages.id],
    }),
    workspaceMember: one(workspaceMembers, {
      fields: [pagePermissions.workspaceMemberId],
      references: [workspaceMembers.id],
    }),
  }),
);
