import { useMemo } from 'react'
import { CommentCard } from './comment-card'
import { CommentComposer } from './comment-composer'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import type { Comment } from '../types'
import type { WorkspaceId } from '@/features/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'
import { m } from '@/paraglide/messages'

interface CommentsPanelPresenterProps {
  comments: Comment[]
  canComment: boolean
  workspaceId: WorkspaceId
  pageId: PageId
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
}

export function CommentsPanelPresenter({
  comments,
  canComment,
  workspaceId,
  pageId,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: CommentsPanelPresenterProps) {
  const unresolvedFirst = useMemo(
    () =>
      [...comments].sort((a, b) =>
        a.isResolved === b.isResolved ? 0 : a.isResolved ? 1 : -1,
      ),
    [comments],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center border-b px-4">
        <h2 className="text-sm font-semibold">{m.comments_title()}</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {unresolvedFirst.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            canComment={canComment}
            workspaceId={workspaceId}
            pageId={pageId}
          />
        ))}

        <InfiniteScroll
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          loadingText="Loading more comments…"
          loadMoreText="Load more comments"
        />
      </div>
      {canComment ? (
        <div className="shrink-0 border-t p-4">
          <CommentComposer
            workspaceId={workspaceId}
            pageId={pageId}
            placeholder={m.comments_placeholder()}
          />
        </div>
      ) : null}
    </div>
  )
}
