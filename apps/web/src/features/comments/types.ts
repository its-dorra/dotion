import type { PageId } from '@dotion/shared/pages/types'
import type { UserId } from '@dotion/shared/users/types'
import type { CommentId, CommentWsMessage } from '@dotion/shared/comments/types'
import type { WorkspaceId } from '../workspaces/types'

export type { CommentId, CommentWsMessage }

export interface CommentAuthor {
  userId: UserId
  name: string
  avatarUrl?: string
}

export interface Comment {
  id: CommentId
  pageId: PageId
  authorId: UserId
  parentId: CommentId | null
  author: CommentAuthor
  body: string
  isResolved: boolean
  createdAt: string
  updatedAt: string
  replies: Comment[]
}

export interface CreateCommentInput {
  workspaceId: WorkspaceId
  pageId: PageId
  body: string
  parentId?: CommentId | null
}

export interface ResolveCommentInput {
  workspaceId: WorkspaceId
  pageId: PageId
  commentId: CommentId
}

export interface DeleteCommentInput {
  workspaceId: WorkspaceId
  pageId: PageId
  commentId: CommentId
  parentId?: CommentId | null
}
