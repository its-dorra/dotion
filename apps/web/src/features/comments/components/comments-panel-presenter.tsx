import { CommentThreadCard } from "./comment-thread-card";
import { CommentComposer } from "./comment-composer";
import type { CommentThread } from "../types";

interface CommentsPanelPresenterProps {
  threads: CommentThread[];
  canComment: boolean;
  onReply: (threadId: string, body: string) => void;
  onResolve: (threadId: string) => void;
  onStartNewThread: (body: string) => void;
  isSubmitting: boolean;
}

export function CommentsPanelPresenter({
  threads,
  canComment,
  onReply,
  onResolve,
  onStartNewThread,
  isSubmitting,
}: CommentsPanelPresenterProps) {
  const unresolvedFirst = [...threads].sort((a, b) =>
    a.isResolved === b.isResolved ? 0 : a.isResolved ? 1 : -1,
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center border-b px-3">
        <h2 className="text-sm font-medium">Comments</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {unresolvedFirst.map((thread) => (
          <CommentThreadCard
            key={thread.id}
            thread={thread}
            canComment={canComment}
            onReply={onReply}
            onResolve={onResolve}
            isReplying={isSubmitting}
          />
        ))}
      </div>
      {canComment ? (
        <div className="shrink-0 border-t p-3">
          <CommentComposer
            onSubmit={onStartNewThread}
            isSubmitting={isSubmitting}
          />
        </div>
      ) : null}
    </div>
  );
}
