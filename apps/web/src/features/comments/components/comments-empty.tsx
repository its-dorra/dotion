import { MessageSquare } from 'lucide-react'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { CommentComposer } from './comment-composer'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '@/features/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'

interface CommentsEmptyProps {
  canComment: boolean
  workspaceId: WorkspaceId
  pageId: PageId
}

export function CommentsEmpty({
  canComment,
  workspaceId,
  pageId,
}: CommentsEmptyProps) {
  return (
    <Empty className="border-0 p-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MessageSquare className="size-5 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle className="text-sm font-medium">
          {m.comments_empty_title()}
        </EmptyTitle>
        <EmptyDescription className="max-w-[220px]">
          {m.comments_empty_desc()}
        </EmptyDescription>
      </EmptyHeader>
      {canComment && (
        <EmptyContent className="w-full max-w-none">
          <CommentComposer
            workspaceId={workspaceId}
            pageId={pageId}
            placeholder={m.comments_placeholder()}
          />
        </EmptyContent>
      )}
    </Empty>
  )
}
