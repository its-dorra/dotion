import type z from "zod";
import type {
  pageId,
  CreatePageSchema,
  PagePermissionSchema,
  CreatePagePermissionSchema,
  PageSchema,
  PagePermissionRoleSchema,
  AllPageRoleSchema,
  PageMemberPermissionSchema,
  PaginatedPageMemberPermissionsSchema,
  UpdatePagePermissionRoleSchema,
  UpdatePageMetadataSchema,
  PageClientWsMessageSchema,
  PageAccessRequestSchema,
  CreatePageAccessRequestSchema,
  PageAccessRequestStatusResponseSchema,
} from "./schema";

export type PageId = z.infer<typeof pageId>;
export type Page = z.infer<typeof PageSchema>;
export type PageTreeNode = Pick<Page, "id" | "title" | "icon" | "parentId">;
export type CreatePageInput = z.infer<typeof CreatePageSchema>;
export type PagePermission = z.infer<typeof PagePermissionSchema>;
export type CreatePagePermissionInput = z.infer<
  typeof CreatePagePermissionSchema
>;
export type PagePermissionRole = z.infer<typeof PagePermissionRoleSchema>;
export type AllPageRole = z.infer<typeof AllPageRoleSchema>;
export type PageMemberPermission = z.infer<typeof PageMemberPermissionSchema>;
export type PaginatedPageMemberPermissions = z.infer<
  typeof PaginatedPageMemberPermissionsSchema
>;
export type UpdatePagePermissionRoleInput = z.infer<
  typeof UpdatePagePermissionRoleSchema
>;
export type UpdatePageMetadataInput = z.infer<typeof UpdatePageMetadataSchema>;
export type PageClientWsMessage = z.infer<typeof PageClientWsMessageSchema>;
export type PageAccessRequest = z.infer<typeof PageAccessRequestSchema>;
export type CreatePageAccessRequestInput = z.infer<
  typeof CreatePageAccessRequestSchema
>;
export type PageAccessRequestStatusResponse = z.infer<
  typeof PageAccessRequestStatusResponseSchema
>;
