export type PagePermissionRole = "viewer" | "commenter" | "editor";

export interface PageMemberPermission {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: PagePermissionRole;
}

export interface PageTreeNode {
  id: string;
  title: string;
  icon?: string;
  parentId: string | null;
  workspaceId: string;
  hasChildren: boolean;
  isInTrash: boolean;
}

export interface PageBreadcrumb {
  id: string;
  title: string;
  icon?: string;
}

export interface Page {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon?: string;
  coverImageUrl?: string;
  isPublic: boolean;
  publicLinkSlug?: string;
  isInTrash: boolean;
  lastEditedAt: string;
  lastEditedByName: string;
  createdAt: string;
  /** The current viewer's effective permission on this page. */
  currentUserRole: PagePermissionRole;
  breadcrumbs: PageBreadcrumb[];
  /**
   * BlockNote document content. Treated as an opaque JSON blob by everything
   * outside the editor itself — mock data stores a minimal valid document.
   */
  content: unknown;
}

export interface TrashedPage {
  id: string;
  title: string;
  icon?: string;
  deletedAt: string;
  deletedByName: string;
}

export interface CreatePageInput {
  workspaceId: string;
  parentId: string | null;
  title?: string;
}

export interface RenamePageInput {
  pageId: string;
  title: string;
}

export interface MoveToTrashInput {
  pageId: string;
}

export interface RestoreFromTrashInput {
  pageId: string;
}

export interface DeletePermanentlyInput {
  pageId: string;
}

export interface UpdatePagePermissionInput {
  pageId: string;
  userId: string;
  role: PagePermissionRole;
  /** The acting user's role — only editors may change page permissions. */
  actingUserRole: PagePermissionRole;
}

export interface InviteToPageInput {
  pageId: string;
  email: string;
  role: PagePermissionRole;
  /** The acting user's role — only editors may invite others to a page. */
  actingUserRole: PagePermissionRole;
}

export interface SetPagePublicInput {
  pageId: string;
  isPublic: boolean;
}
