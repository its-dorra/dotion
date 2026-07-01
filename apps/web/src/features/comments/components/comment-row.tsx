import { MemberAvatar } from "@/features/workspaces/components/member-avatar";
import type { Comment } from "../types";

function formatTime(isoDate: string) {
  return new Date(isoDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

interface CommentRowProps {
  comment: Comment;
}

export function CommentRow({ comment }: CommentRowProps) {
  return (
    <div className="flex gap-2.5">
      <MemberAvatar name={comment.author.name} avatarUrl={comment.author.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">{comment.author.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatTime(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm leading-relaxed">{comment.body}</p>
      </div>
    </div>
  );
}
