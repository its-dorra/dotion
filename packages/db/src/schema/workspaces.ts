import {
  snakeCase,
  index,
  integer,
  primaryKey,
  text,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt, textId } from "../utils";
import { users } from "./auth";
import { sql } from "drizzle-orm";
import type { UserId } from "@dotion/shared/users/types";
import type {
  WorkspaceId,
  WorkspaceInvitationId,
} from "@dotion/shared/workspaces/types";

export const workspaces = snakeCase.table(
  "workspaces",
  {
    id: textId<WorkspaceId>(),
    name: text().notNull(),
    icon: text(),
    membersCount: integer().notNull().default(0),
    createdAt,
    updatedAt,
  },
  (table) => [index("workspaces_name_idx").on(table.name)],
);

export const workspaceMembers = snakeCase.table(
  "workspace_members",
  {
    workspaceId: text()
      .$type<WorkspaceId>()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text()
      .$type<UserId>()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "member"] }).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [
    primaryKey({
      columns: [t.workspaceId, t.userId],
    }),
    index("workspace_members_user_id_idx").on(t.userId),
    index("workspace_members_workspace_id_created_at_idx").on(
      t.workspaceId,
      t.createdAt,
    ),
    uniqueIndex("workspace_members_workspace_id_owner")
      .on(t.workspaceId)
      .where(sql`${t.role} = 'owner'`),
  ],
);

export const workspaceInvitations = snakeCase.table(
  "workspace_invitations",
  {
    id: textId<WorkspaceInvitationId>(),
    workspaceId: text()
      .$type<WorkspaceId>()
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    invitedUserId: text()
      .$type<UserId>()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    invitedByUserId: text()
      .$type<UserId>()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["pending", "accepted", "declined", "cancelled"],
    })
      .notNull()
      .default("pending"),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("workspace_invitations_workspace_id_idx").on(t.workspaceId),
    index("workspace_invitations_invited_user_id_idx").on(t.invitedUserId),
    index("workspace_invitations_workspace_status_created_at_idx").on(
      t.workspaceId,
      t.status,
      t.createdAt,
    ),
    uniqueIndex("workspace_invitations_pending_unique")
      .on(t.workspaceId, t.invitedUserId)
      .where(sql`${t.status} = 'pending'`),
  ],
);
