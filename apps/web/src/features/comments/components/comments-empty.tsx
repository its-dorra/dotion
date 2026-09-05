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
import * as m from '@/paraglide/messages'

interface CommentsEmptyProps {
  canComment: boolean
  onStartDiscussion: (body: string) => void
  isSubmitting: boolean
}

export function CommentsEmpty({
  canComment,
  onStartDiscussion,
  isSubmitting,
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
            onSubmit={onStartDiscussion}
            isSubmitting={isSubmitting}
            placeholder={m.comments_placeholder()}
          />
        </EmptyContent>
      )}
    </Empty>
  )
}
