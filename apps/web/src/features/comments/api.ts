import { Result } from 'better-result'
import { ValidationError, AppError, AuthenticationError } from '@/lib/errors'
import { getApiClient } from '@/lib/api-client'
import { matchExhaustive } from '@/lib/utils'
import {
  CommentNotFoundError,
  InsufficientCommentPermissionError,
} from './errors'
import type {
  Comment,
  CreateCommentInput,
  ResolveCommentInput,
  DeleteCommentInput,
} from './types'
import { mapServerCommentToComment } from './utils'
import type { CommentWithRepliesAndAuthor } from '@dotion/shared/comments/types'
import type { WorkspaceId } from '../workspaces/types'
import type { PageId } from '../pages/types'

import type {
  PaginationQuery,
  PaginatedData,
} from '@dotion/shared/pagination/types'

export class CommentsApi {
  async getComments(
    workspaceId: WorkspaceId,
    pageId: PageId,
    query?: PaginationQuery,
  ): Promise<
    Result<
      PaginatedData<Comment>,
      InsufficientCommentPermissionError | AppError | AuthenticationError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].pages[
        ':pageId'
      ].comments.$get({
        param: { id: workspaceId, pageId },
        query: {
          page: query?.page ? String(query.page) : '1',
          limit: query?.limit ? String(query.limit) : '20',
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [401]: () =>
            Result.err(
              new AuthenticationError({
                message: 'You must be logged in to view comments.',
              }),
            ),
          [403]: () =>
            Result.err(
              new InsufficientCommentPermissionError({
                message: 'You do not have permission to view comments.',
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'comments',
                message: 'Failed to fetch comments.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'comments',
                message: `Unexpected error: ${response.status}`,
              }),
            ),
        })
      }

      const json = await response.json()
      const serverData =
        json.data as unknown as PaginatedData<CommentWithRepliesAndAuthor>
      return Result.ok({
        pagination: serverData.pagination,
        payload: serverData.payload.map(mapServerCommentToComment),
      })
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch comments.'
      return Result.err(
        new AppError({
          source: 'comments',
          message,
        }),
      )
    }
  }

  async createComment(
    workspaceId: WorkspaceId,
    input: CreateCommentInput,
  ): Promise<
    Result<
      Comment,
      | ValidationError
      | CommentNotFoundError
      | InsufficientCommentPermissionError
      | AppError
      | AuthenticationError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].pages[
        ':pageId'
      ].comments.$post({
        param: {
          id: workspaceId,
          pageId: input.pageId,
        },
        json: {
          body: input.body,
          parentId: input.parentId ?? undefined,
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [400]: () =>
            Result.err(
              new ValidationError({
                message: 'Invalid comment payload.',
                field: 'body',
              }),
            ),
          [401]: () =>
            Result.err(
              new AuthenticationError({
                message: 'You must be logged in to comment.',
              }),
            ),
          [403]: () =>
            Result.err(
              new InsufficientCommentPermissionError({
                message: 'You do not have permission to comment on this page.',
              }),
            ),
          [404]: () =>
            Result.err(
              new CommentNotFoundError({
                message: 'Parent comment not found.',
                commentId: input.parentId || '',
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'comments',
                message: 'Failed to create comment.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'comments',
                message: `Unexpected error: ${response.status}`,
              }),
            ),
        })
      }

      const json = await response.json()
      const serverComment = json.data as unknown as CommentWithRepliesAndAuthor
      return Result.ok(mapServerCommentToComment(serverComment))
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to create comment.'
      return Result.err(
        new AppError({
          source: 'comments',
          message,
        }),
      )
    }
  }

  async resolveComment(
    workspaceId: WorkspaceId,
    input: ResolveCommentInput,
  ): Promise<
    Result<
      null,
      | CommentNotFoundError
      | InsufficientCommentPermissionError
      | AppError
      | AuthenticationError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].pages[
        ':pageId'
      ].comments[':commentId'].resolve.$patch({
        param: {
          id: workspaceId,
          pageId: input.pageId,
          commentId: input.commentId,
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [400]: () =>
            Result.err(
              new AppError({
                source: 'comments',
                message: 'Bad request resolving comment.',
              }),
            ),
          [401]: () =>
            Result.err(
              new AuthenticationError({
                message: 'You must be logged in.',
              }),
            ),
          [403]: () =>
            Result.err(
              new InsufficientCommentPermissionError({
                message: 'You do not have permission to resolve this comment.',
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'comments',
                message: 'Failed to resolve comment.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'comments',
                message: `Unexpected error: ${response.status}`,
              }),
            ),
        })
      }

      return Result.ok(null)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to resolve comment.'
      return Result.err(
        new AppError({
          source: 'comments',
          message,
        }),
      )
    }
  }

  async deleteComment(
    workspaceId: WorkspaceId,
    input: DeleteCommentInput,
  ): Promise<
    Result<
      true,
      | CommentNotFoundError
      | InsufficientCommentPermissionError
      | AppError
      | AuthenticationError
    >
  > {
    try {
      const apiClient = getApiClient()
      const response = await apiClient.api.v1.workspaces[':id'].pages[
        ':pageId'
      ].comments[':commentId'].$delete({
        param: {
          id: workspaceId,
          pageId: input.pageId,
          commentId: input.commentId,
        },
      })

      if (!response.ok) {
        return matchExhaustive(response.status, {
          [400]: () =>
            Result.err(
              new AppError({
                source: 'comments',
                message: 'Bad request deleting comment.',
              }),
            ),
          [401]: () =>
            Result.err(
              new AuthenticationError({
                message: 'You must be logged in.',
              }),
            ),
          [403]: () =>
            Result.err(
              new InsufficientCommentPermissionError({
                message: 'You do not have permission to delete this comment.',
              }),
            ),
          [404]: () =>
            Result.err(
              new CommentNotFoundError({
                message: 'Comment not found.',
                commentId: input.commentId,
              }),
            ),
          [500]: () =>
            Result.err(
              new AppError({
                source: 'comments',
                message: 'Failed to delete comment.',
              }),
            ),
          default: () =>
            Result.err(
              new AppError({
                source: 'comments',
                message: `Unexpected error: ${response.status}`,
              }),
            ),
        })
      }

      return Result.ok(true)
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete comment.'
      return Result.err(
        new AppError({
          source: 'comments',
          message,
        }),
      )
    }
  }
}

export const commentsApi = new CommentsApi()
