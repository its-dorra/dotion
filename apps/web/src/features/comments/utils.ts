import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type {
  CommentWsMessage,
  CommentWithRepliesAndAuthor,
  CommentWithAuthor,
} from '@dotion/shared/comments/types'
import type { PaginatedData } from '@dotion/shared/pagination/types'
import type { Comment } from './types'
import { commentsKeys } from './query-options'
import type { PageId } from '../pages/types'
import type { WorkspaceId } from '../workspaces/types'

export function mapServerCommentToComment(
  serverComment: CommentWithRepliesAndAuthor | CommentWithAuthor,
): Comment {
  const replies =
    'replies' in serverComment && Array.isArray(serverComment.replies)
      ? serverComment.replies.map(mapServerCommentToComment)
      : []

  return {
    id: serverComment.id,
    pageId: serverComment.pageId,
    authorId: serverComment.authorId,
    parentId: serverComment.parentId,
    body: serverComment.body,
    isResolved: serverComment.isResolved,
    createdAt:
      serverComment.createdAt instanceof Date
        ? serverComment.createdAt.toISOString()
        : String(serverComment.createdAt),
    updatedAt:
      serverComment.updatedAt instanceof Date
        ? serverComment.updatedAt.toISOString()
        : String(serverComment.updatedAt),
    author: {
      userId: serverComment.authorId,
      name: serverComment.author?.name ?? 'Anonymous',
      avatarUrl: serverComment.author?.image ?? undefined,
    },
    replies,
  }
}

export const handleCommentCreatedWsMessage = ({
  queryClient,
  workspaceId,
  pageId,
  payload,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  pageId: PageId
  payload: Extract<CommentWsMessage, { type: 'comment.created' }>['payload']
}) => {
  const formattedComment = mapServerCommentToComment(payload.comment)
  const queryKey = commentsKeys.list(workspaceId, pageId)

  queryClient.setQueryData<InfiniteData<PaginatedData<Comment>>>(
    queryKey,
    (oldData) => {
      if (!oldData) return oldData

      // If it's a top-level comment
      if (!formattedComment.parentId) {
        let found = false
        const updatedPages = oldData.pages.map((page) => {
          const existingIndex = page.payload.findIndex(
            (c) => c.id === formattedComment.id,
          )
          if (existingIndex >= 0) {
            found = true
            const newPayload = [...page.payload]
            newPayload[existingIndex] = formattedComment
            return { ...page, payload: newPayload }
          }
          return page
        })

        if (!found && updatedPages.length > 0 && updatedPages[0]) {
          const firstPage = updatedPages[0]
          updatedPages[0] = {
            ...firstPage,
            payload: [...firstPage.payload, formattedComment],
            pagination: {
              ...firstPage.pagination,
              total: firstPage.pagination.total + 1,
            },
          }
        }

        return { ...oldData, pages: updatedPages }
      }

      // If it's a reply, update parent across pages
      const updatedPages = oldData.pages.map((page) => ({
        ...page,
        payload: page.payload.map((rootComment) => {
          if (rootComment.id !== formattedComment.parentId) return rootComment

          const existingReplyIndex = rootComment.replies.findIndex(
            (r) => r.id === formattedComment.id,
          )
          const updatedReplies =
            existingReplyIndex >= 0
              ? rootComment.replies.map((r, i) =>
                  i === existingReplyIndex ? formattedComment : r,
                )
              : [...rootComment.replies, formattedComment]

          return { ...rootComment, replies: updatedReplies }
        }),
      }))

      return { ...oldData, pages: updatedPages }
    },
  )
}

export const handleCommentResolvedWsMessage = ({
  queryClient,
  workspaceId,
  pageId,
  payload,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  pageId: PageId
  payload: Extract<CommentWsMessage, { type: 'comment.resolved' }>['payload']
}) => {
  const queryKey = commentsKeys.list(workspaceId, pageId)

  queryClient.setQueryData<InfiniteData<PaginatedData<Comment>>>(
    queryKey,
    (oldData) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          payload: page.payload.map((comment) => {
            if (comment.id === payload.commentId) {
              return { ...comment, isResolved: true }
            }
            return comment
          }),
        })),
      }
    },
  )
}

export const handleCommentDeletedWsMessage = ({
  queryClient,
  workspaceId,
  pageId,
  payload,
}: {
  queryClient: QueryClient
  workspaceId: WorkspaceId
  pageId: PageId
  payload: Extract<CommentWsMessage, { type: 'comment.deleted' }>['payload']
}) => {
  const queryKey = commentsKeys.list(workspaceId, pageId)

  queryClient.setQueryData<InfiniteData<PaginatedData<Comment>>>(
    queryKey,
    (oldData) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        pages: oldData.pages.map((page) => {
          if (payload.isRoot) {
            return {
              ...page,
              payload: page.payload.filter((c) => c.id !== payload.commentId),
              pagination: {
                ...page.pagination,
                total: Math.max(0, page.pagination.total - 1),
              },
            }
          }

          return {
            ...page,
            payload: page.payload.map((comment) => {
              if (payload.parentId && comment.id !== payload.parentId)
                return comment
              return {
                ...comment,
                replies: comment.replies.filter(
                  (r) => r.id !== payload.commentId,
                ),
              }
            }),
          }
        }),
      }
    },
  )
}
