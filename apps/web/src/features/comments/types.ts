import type { PagePermissionRole } from "@/features/pages/types";

export interface CommentAuthor {
  userId: string;
  name: string;
  avatarUrl?: string;
}

export interface Comment {
  id: string;
  pageId: string;
  /** Null for page-level comments; set for inline/block-anchored comments. */
  blockId: string | null;
  threadId: string;
  author: CommentAuthor;
  body: string;
  createdAt: string;
  isResolved: boolean;
}

export interface CommentThread {
  id: string;
  pageId: string;
  blockId: string | null;
  isResolved: boolean;
  comments: Comment[];
}

export interface CreateCommentInput {
  pageId: string;
  blockId: string | null;
  body: string;
  /** Provide to reply within an existing thread instead of starting one. */
  threadId?: string;
  /**
   * The acting user's permission on this page. The API enforces that only
   * commenters and editors may create comments — this isn't just a UI
   * gate, since a backend boundary should never trust the client alone.
   */
  currentUserRole: PagePermissionRole;
}

export interface ResolveThreadInput {
  threadId: string;
}

export interface DeleteCommentInput {
  commentId: string;
}
