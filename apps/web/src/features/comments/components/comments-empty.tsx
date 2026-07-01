import { MessageSquare } from "lucide-react";
import { CommentComposer } from "./comment-composer";

interface CommentsEmptyProps {
  canComment: boolean;
  onStartDiscussion: (body: string) => void;
  isSubmitting: boolean;
}

export function CommentsEmpty({
  canComment,
  onStartDiscussion,
  isSubmitting,
}: CommentsEmptyProps) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No comments yet</p>
      <p className="max-w-[220px] text-sm text-muted-foreground">
        {canComment
          ? "Start a discussion about this page."
          : "Comments on this page will show up here."}
      </p>
      {canComment ? (
        <div className="w-full">
          <CommentComposer
            onSubmit={onStartDiscussion}
            isSubmitting={isSubmitting}
            placeholder="Start the discussion…"
          />
        </div>
      ) : null}
    </div>
  );
}
