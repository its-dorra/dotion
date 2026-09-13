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
  PageCleanupQueueMessageSchema,
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
export type PageCleanupQueueMessage = z.infer<
  typeof PageCleanupQueueMessageSchema
>;

export interface BlockNoteInlineContent {
  type: string;
  text?: string;
  href?: string;
  content?: BlockNoteInlineContent[] | string;
  styles?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BlockNoteTableCell {
  text?: string;
  content?: BlockNoteInlineContent[] | string;
  [key: string]: unknown;
}

export interface BlockNoteBlock {
  id?: string;
  type?: string;
  props?: {
    level?: number;
    checked?: boolean | string;
    language?: string;
    icon?: string;
    textAlignment?: string;
    textColor?: string;
    backgroundColor?: string;
    [key: string]: unknown;
  };
  content?:
    | BlockNoteInlineContent[]
    | string
    | { type: string; rows: { cells: BlockNoteTableCell[] }[] };
  children?: BlockNoteBlock[];
  [key: string]: unknown;
}

export interface ParsedSection {
  sectionIndex: number;
  sectionTitle: string;
  headingBlockId: string;
  blockIds: string[];
  content: string;
  contentHash: string;
}
