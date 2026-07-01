import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommentRow } from "./comment-row";
import { CommentComposer } from "./comment-composer";
import type { CommentThread } from "../types";

interface CommentThreadCardProps {
  thread: CommentThread;
  canComment: boolean;
  onReply: (threadId: string, body: string) => void;
  onResolve: (threadId: string) => void;
  isReplying: boolean;
}

export function CommentThreadCard({
  thread,
  canComment,
  onReply,
  onResolve,
  isReplying,
}: CommentThreadCardProps) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="space-y-3">
        {thread.comments.map((comment) => (
          <CommentRow key={comment.id} comment={comment} />
        ))}
      </div>
      {!thread.isResolved ? (
        <div className="space-y-2">
          {canComment ? (
            <CommentComposer
              onSubmit={(body) => onReply(thread.id, body)}
              isSubmitting={isReplying}
              placeholder="Reply…"
            />
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            onClick={() => onResolve(thread.id)}
          >
            <Check className="h-3.5 w-3.5" />
            Resolve
          </Button>
        </div>
      ) : (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="h-3.5 w-3.5" />
          Resolved
        </span>
      )}
    </div>
  );
}
