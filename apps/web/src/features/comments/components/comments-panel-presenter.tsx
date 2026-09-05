import { CommentCard } from './comment-card'
import { CommentComposer } from './comment-composer'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import type { Comment, CommentId } from '../types'
import * as m from '@/paraglide/messages'

interface CommentsPanelPresenterProps {
  comments: Comment[]
  canComment: boolean
  onResolve: (commentId: CommentId) => void
  onReply: (parentId: CommentId, body: string) => void
  onAddComment: (body: string) => void
  onDelete: (commentId: CommentId) => void
  isSubmitting: boolean
  isSubmittingReply?: boolean
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
}

export function CommentsPanelPresenter({
  comments,
  canComment,
  onResolve,
  onReply,
  onAddComment,
  onDelete,
  isSubmitting,
  isSubmittingReply,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: CommentsPanelPresenterProps) {
  const unresolvedFirst = [...comments].sort((a, b) =>
    a.isResolved === b.isResolved ? 0 : a.isResolved ? 1 : -1,
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
            onResolve={onResolve}
            onReply={onReply}
            onDelete={onDelete}
            isSubmittingReply={isSubmittingReply}
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
            placeholder={m.comments_placeholder()}
            onSubmit={onAddComment}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : null}
    </div>
  )
}
