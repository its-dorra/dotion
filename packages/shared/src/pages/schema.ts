import { pagePermissions, pages } from "@dotion/db/schema";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/zod";
import { pageId, workspaceId, userId } from "../ids";
import { PAGE_PERMISSION_ROLES, ALL_PAGE_ROLES } from "./constants";
import {
  WorkspaceMemberDetailSchema,
  WorkspaceMemberRoleSchema,
} from "../workspaces/schema";
import { createPaginatedDataSchema } from "../pagination/schema";
import z from "zod";

export { pageId, PAGE_PERMISSION_ROLES, ALL_PAGE_ROLES };

export const PagePermissionRoleSchema = z.enum(PAGE_PERMISSION_ROLES);
export const AllPageRoleSchema = z.enum(ALL_PAGE_ROLES);

export const PageSchema = createSelectSchema(pages, {
  id: pageId,
  workspaceId,
  parentId: pageId.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).omit({
  content: true,
});

export const CreatePageSchema = createInsertSchema(pages, {
  id: pageId,
  parentId: pageId.optional(),
  workspaceId,
}).pick({
  title: true,
  icon: true,
  parentId: true,
  workspaceId: true,
});

export const PagePermissionSchema = createSelectSchema(pagePermissions, {
  pageId,
  userId,
  workspaceId,
  role: PagePermissionRoleSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreatePagePermissionSchema = createInsertSchema(pagePermissions, {
  pageId,
  userId,
  workspaceId,
}).pick({
  pageId: true,
  userId: true,
  workspaceId: true,
  role: true,
});

export const PageMemberPermissionSchema = WorkspaceMemberDetailSchema.omit({
  role: true,
}).extend({
  role: AllPageRoleSchema,
  workspaceRole: WorkspaceMemberRoleSchema.optional(),
});

export const PaginatedPageMemberPermissionsSchema = createPaginatedDataSchema(
  PageMemberPermissionSchema,
);

export const UpdatePagePermissionRoleSchema = z.object({
  role: AllPageRoleSchema,
});

export const UpdatePageMetadataSchema = createInsertSchema(pages)
  .pick({
    title: true,
    icon: true,
    cover: true,
  })
  .partial();

export const PageClientWsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("page.update_metadata"),
    payload: UpdatePageMetadataSchema,
  }),
]);

export const PageAccessRequestStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);

export const CreatePageAccessRequestSchema = z.object({
  requestedRole: PagePermissionRoleSchema.default("editor"),
});

export const PageAccessRequestSchema = z.object({
  id: z.string(),
  pageId,
  workspaceId,
  userId,
  requestedRole: PagePermissionRoleSchema,
  status: PageAccessRequestStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const PageAccessRequestStatusResponseSchema = z.object({
  hasPendingRequest: z.boolean(),
  request: PageAccessRequestSchema.nullable(),
});

export const PageCleanupQueueMessageSchema = z.object({
  workspaceId,
  pageId,
});
