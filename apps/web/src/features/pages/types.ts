import type { CommentWsMessage } from '@dotion/shared/comments/types'
import type {
  PageId,
  Page,
  PageTreeNode,
  CreatePageInput,
  UpdatePageMetadataInput,
  PageClientWsMessage,
  PageMemberPermission,
  PaginatedPageMemberPermissions,
  AllPageRole as PagePermissionRole,
  AllPageRole,
  PageAccessRequestStatusResponse,
} from '@dotion/shared/pages/types'
import type { UserId } from '@dotion/shared/users/types'
import type { WorkspaceId } from '../workspaces/types'

export type {
  PageId,
  Page,
  PageTreeNode,
  CreatePageInput,
  UpdatePageMetadataInput,
  PageClientWsMessage,
  PageMemberPermission,
  PaginatedPageMemberPermissions,
  PagePermissionRole,
  AllPageRole,
  PageAccessRequestStatusResponse,
}

export type PageWsMessage =
  | { type: 'yjs'; data: ArrayBuffer }
  | { type: 'comment'; data: CommentWsMessage }
  | { type: 'metadata'; data: PageClientWsMessage }

export interface PageBreadcrumb {
  id: PageId
  title: string
  icon?: string
}

export interface TrashedPage {
  id: PageId
  parentId: PageId | null
  title: string
  icon?: string
  deletedAt: string
  deletedByName: string
}

export interface RenamePageInput {
  pageId: PageId
  title: string
}

export interface MoveToTrashInput {
  workspaceId: WorkspaceId
  pageId: PageId
}

export interface RestoreFromTrashInput {
  workspaceId: WorkspaceId
  pageId: PageId
}

export interface DeletePermanentlyInput {
  workspaceId: WorkspaceId
  pageId: PageId
}

export interface EmptyTrashInput {
  workspaceId: WorkspaceId
}

export interface UpdatePagePermissionInput {
  workspaceId: WorkspaceId
  pageId: PageId
  userId: UserId
  role: PagePermissionRole
}

export interface InviteToPageInput {
  workspaceId: WorkspaceId
  pageId: PageId
  email: string
  role: PagePermissionRole
  actingUserRole?: PagePermissionRole
}

export interface SetPagePublicInput {
  pageId: PageId
  isPublic: boolean
}
