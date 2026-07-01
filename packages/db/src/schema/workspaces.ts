import { index, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { createdAt, updatedAt, uuidId } from "../utils";
import { users } from "./auth";
import { relations } from "drizzle-orm";
import { pagePermissions, pages } from "./pages";

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuidId("id"),
    name: text("name").notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index("workspaces_name_idx").on(table.name)],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuidId("id"),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt,
    updatedAt,
  },
  (t) => [
    unique("workspace_members_workspaceId_userId_role").on(
      t.workspaceId,
      t.userId,
    ),
  ],
);

export const workspaceRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  pages: many(pages),
}));

export const workspaceMemberRelations = relations(
  workspaceMembers,
  ({ one, many }) => ({
    workspace: one(workspaces, {
      fields: [workspaceMembers.workspaceId],
      references: [workspaces.id],
    }),
    user: one(users, {
      fields: [workspaceMembers.userId],
      references: [users.id],
    }),
    pagePermissions: many(pagePermissions),
  }),
);
