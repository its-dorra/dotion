import { MemberAvatar } from '@/features/workspaces/components/member-avatar'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Can } from '@/features/authorization/components/can'
import { useDeleteComment } from '../hooks/use-delete-comment'
import type { Comment } from '../types'
import type { WorkspaceId } from '@/features/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface CommentRowProps {
  comment: Comment
  workspaceId: WorkspaceId
  pageId: PageId
}

export function CommentRow({ comment, workspaceId, pageId }: CommentRowProps) {
  const deleteComment = useDeleteComment()

  async function handleDelete() {
    await deleteComment.mutateAsync({
      workspaceId,
      pageId,
      commentId: comment.id,
    })
  }

  return (
    <div className="group relative flex gap-2.5">
      <MemberAvatar
        name={comment.author.name}
        avatarUrl={comment.author.avatarUrl}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatTime(comment.createdAt)}
            </span>
          </div>
          <Can
            resource={{ type: 'comment', id: { commentId: comment.id } }}
            action="delete"
          >
            <Button
              variant="ghost"
              size="icon-xs"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              disabled={deleteComment.isPending}
              onClick={handleDelete}
              aria-label="Delete comment"
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </Button>
          </Can>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {comment.body}
        </p>
      </div>
    </div>
  )
}
