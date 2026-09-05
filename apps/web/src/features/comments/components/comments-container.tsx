import { useInfiniteQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { commentsInfiniteQueryOptions } from '../query-options'
import { useCreateComment } from '../hooks/use-create-comment'
import { useResolveComment } from '../hooks/use-resolve-comment'
import { useDeleteComment } from '../hooks/use-delete-comment'
import { CommentsPanelPresenter } from './comments-panel-presenter'
import { CommentsLoading } from './comments-loading'
import { CommentsError } from './comments-error'
import { CommentsEmpty } from './comments-empty'
import * as m from '@/paraglide/messages'
import type { PagePermissionRole } from '@/features/pages/types'
import type { PageId } from '@dotion/shared/pages/types'
import type { CommentId } from '@dotion/shared/comments/types'
import type { WorkspaceId } from '@/features/workspaces/types'

interface CommentsContainerProps {
  workspaceId: WorkspaceId
  pageId: PageId
  currentUserRole: PagePermissionRole
}

export function CommentsContainer({
  workspaceId,
  pageId,
  currentUserRole,
}: CommentsContainerProps) {
  const query = useInfiniteQuery(
    commentsInfiniteQueryOptions(workspaceId, pageId),
  )
  const createComment = useCreateComment()
  const resolveComment = useResolveComment()
  const deleteComment = useDeleteComment()

  const canComment = currentUserRole !== 'viewer'

  async function handleAddComment(body: string) {
    try {
      await createComment.mutateAsync({
        workspaceId,
        pageId,
        body,
      })
    } catch (error: any) {
      toast.error(error?.message ?? m.toast_comment_add_failed())
    }
  }

  async function handleReply(parentId: CommentId, body: string) {
    try {
      await createComment.mutateAsync({
        workspaceId,
        pageId,
        parentId,
        body,
      })
    } catch (error: any) {
      toast.error(error?.message ?? m.toast_comment_reply_failed())
    }
  }

  async function handleResolve(commentId: CommentId) {
    try {
      await resolveComment.mutateAsync({
        workspaceId,
        pageId,
        commentId,
      })
      toast.success(m.toast_comment_resolved())
    } catch (error: any) {
      toast.error(error?.message ?? m.toast_comment_resolve_failed())
    }
  }

  async function handleDelete(commentId: CommentId) {
    try {
      await deleteComment.mutateAsync({
        workspaceId,
        pageId,
        commentId,
      })
      toast.success(m.toast_comment_deleted())
    } catch (error: any) {
      toast.error(error?.message ?? m.toast_comment_delete_failed())
    }
  }

  if (query.isPending) {
    return <CommentsLoading />
  }

  if (query.isError) {
    return (
      <CommentsError
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    )
  }

  const comments = query.data?.pages.flatMap((page) => page.payload) ?? []

  if (comments.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-12 shrink-0 items-center border-b px-4">
          <h2 className="text-sm font-semibold">Comments</h2>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <CommentsEmpty
            canComment={canComment}
            onStartDiscussion={handleAddComment}
            isSubmitting={createComment.isPending}
          />
        </div>
      </div>
    )
  }

  return (
    <CommentsPanelPresenter
      comments={comments}
      canComment={canComment}
      onResolve={handleResolve}
      onReply={handleReply}
      onAddComment={handleAddComment}
      onDelete={handleDelete}
      isSubmitting={
        createComment.isPending && !createComment.variables?.parentId
      }
      isSubmittingReply={
        createComment.isPending && Boolean(createComment.variables?.parentId)
      }
      hasNextPage={query.hasNextPage}
      fetchNextPage={query.fetchNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
    />
  )
}
