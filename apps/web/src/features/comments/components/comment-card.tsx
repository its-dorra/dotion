import { useState, memo } from 'react'
import { Check, MessageSquareReply } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Can } from '@/features/authorization/components/can'
import { CommentRow } from './comment-row'
import { CommentComposer } from './comment-composer'
import { useResolveComment } from '../hooks/use-resolve-comment'
import { m } from '@/paraglide/messages'
import type { Comment } from '../types'
import type { WorkspaceId } from '@/features/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'

interface CommentCardProps {
  comment: Comment
  canComment: boolean
  workspaceId: WorkspaceId
  pageId: PageId
}

export const CommentCard = memo(function CommentCard({
  comment,
  canComment,
  workspaceId,
  pageId,
}: CommentCardProps) {
  const [showReplyComposer, setShowReplyComposer] = useState(false)
  const resolveComment = useResolveComment()

  async function handleResolve() {
    await resolveComment.mutateAsync({
      workspaceId,
      pageId,
      commentId: comment.id,
    })
  }

  const hasReplies = comment.replies && comment.replies.length > 0

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3 shadow-xs">
      {/* Root comment */}
      <CommentRow comment={comment} workspaceId={workspaceId} pageId={pageId} />

      {/* Action bar */}
      <div className="flex items-center gap-2 pt-1">
        {!comment.isResolved ? (
          <Can
            permission="comment:resolve"
            target={{ commentId: comment.id }}
            workspaceId={workspaceId}
          >
            <Button
              variant="ghost"
              size="xs"
              className="h-6 gap-1 text-xs text-muted-foreground hover:text-foreground"
              disabled={resolveComment.isPending}
              onClick={handleResolve}
            >
              <Check className="h-3 w-3" />
              {m.comments_resolve()}
            </Button>
          </Can>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Check className="h-3 w-3 text-green-500" />
            {m.comments_resolved()}
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
            {m.comments_reply()}
          </Button>
        )}
      </div>

      {/* Nested Replies */}
      {hasReplies && (
        <div className="mt-2 space-y-2.5 border-l-2 border-muted pl-3">
          {comment.replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              workspaceId={workspaceId}
              pageId={pageId}
            />
          ))}
        </div>
      )}

      {/* Inline Reply Composer */}
      {showReplyComposer && canComment && !comment.isResolved && (
        <div className="mt-2 border-t pt-2">
          <CommentComposer
            workspaceId={workspaceId}
            pageId={pageId}
            parentId={comment.id}
            placeholder={m.comments_placeholder()}
            onSuccess={() => setShowReplyComposer(false)}
            autoFocus
          />
        </div>
      )}
    </div>
  )
})
