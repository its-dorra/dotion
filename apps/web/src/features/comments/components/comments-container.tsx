import { useInfiniteQuery } from '@tanstack/react-query'
import { commentsInfiniteQueryOptions } from '../query-options'
import { CommentsPanelPresenter } from './comments-panel-presenter'
import { CommentsLoading } from './comments-loading'
import { CommentsError } from './comments-error'
import { CommentsEmpty } from './comments-empty'
import type { PagePermissionRole } from '@/features/pages/types'
import type { PageId } from '@dotion/shared/pages/types'
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

  const canComment = currentUserRole !== 'viewer'

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
            workspaceId={workspaceId}
            pageId={pageId}
          />
        </div>
      </div>
    )
  }

  return (
    <CommentsPanelPresenter
      comments={comments}
      canComment={canComment}
      workspaceId={workspaceId}
      pageId={pageId}
      hasNextPage={query.hasNextPage}
      fetchNextPage={query.fetchNextPage}
      isFetchingNextPage={query.isFetchingNextPage}
    />
  )
}
