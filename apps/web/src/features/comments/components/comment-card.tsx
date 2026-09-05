import { useState } from 'react'
import { Check, MessageSquareReply } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Can } from '@/features/authorization/components/can'
import { CommentRow } from './comment-row'
import { CommentComposer } from './comment-composer'
import type { Comment, CommentId } from '../types'

interface CommentCardProps {
  comment: Comment
  canComment: boolean
  onResolve: (commentId: CommentId) => void
  onReply: (parentId: CommentId, body: string) => void
  onDelete: (commentId: CommentId) => void
  isSubmittingReply?: boolean
}

export function CommentCard({
  comment,
  canComment,
  onResolve,
  onReply,
  onDelete,
  isSubmittingReply = false,
}: CommentCardProps) {
  const [showReplyComposer, setShowReplyComposer] = useState(false)

  function handleReplySubmit(body: string) {
    onReply(comment.id, body)
    setShowReplyComposer(false)
  }

  const hasReplies = comment.replies && comment.replies.length > 0

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3 shadow-xs">
      {/* Root comment */}
      <CommentRow comment={comment} onDelete={onDelete} />

      {/* Action bar */}
      <div className="flex items-center gap-2 pt-1">
        {!comment.isResolved ? (
          <Can
            resource={{ type: 'comment', id: { commentId: comment.id } }}
            action="resolve"
          >
            <Button
              variant="ghost"
              size="xs"
              className="h-6 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onResolve(comment.id)}
            >
              <Check className="h-3 w-3" />
              Resolve
            </Button>
          </Can>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Check className="h-3 w-3 text-green-500" />
            Resolved
          </span>
        )}

        {canComment && !comment.isResolved && (
          <Button
            variant="ghost"
            size="xs"
            className="h-6 gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowReplyComposer((prev) => !prev)}
          >
            <MessageSquareReply className="h-3 w-3" />
            Reply
          </Button>
        )}
      </div>

      {/* Nested Replies */}
      {hasReplies && (
        <div className="mt-2 space-y-2.5 border-l-2 border-muted pl-3">
          {comment.replies.map((reply) => (
            <CommentRow key={reply.id} comment={reply} onDelete={onDelete} />
          ))}
        </div>
      )}

      {/* Inline Reply Composer */}
      {showReplyComposer && canComment && !comment.isResolved && (
        <div className="mt-2 border-t pt-2">
          <CommentComposer
            placeholder="Reply to this comment…"
            onSubmit={handleReplySubmit}
            isSubmitting={isSubmittingReply}
          />
        </div>
      )}
    </div>
  )
}
