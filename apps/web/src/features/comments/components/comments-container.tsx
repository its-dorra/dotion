import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { commentThreadsQueryOptions } from "../query-options";
import { useCreateComment } from "../hooks/use-create-comment";
import { useResolveThread } from "../hooks/use-resolve-thread";
import { CommentsPanelPresenter } from "./comments-panel-presenter";
import { CommentsLoading } from "./comments-loading";
import { CommentsError } from "./comments-error";
import { CommentsEmpty } from "./comments-empty";
import type { PagePermissionRole } from "@/features/pages/types";

interface CommentsContainerProps {
  pageId: string;
  currentUserRole: PagePermissionRole;
}

export function CommentsContainer({
  pageId,
  currentUserRole,
}: CommentsContainerProps) {
  const query = useQuery(commentThreadsQueryOptions(pageId));
  const createComment = useCreateComment();
  const resolveThread = useResolveThread();

  const canComment = currentUserRole === "commenter" || currentUserRole === "editor";

  if (query.isPending) {
    return <CommentsLoading />;
  }

  if (query.isError) {
    return (
      <CommentsError message={query.error.message} onRetry={() => query.refetch()} />
    );
  }

  function handleStartNewThread(body: string) {
    createComment.mutate(
      { pageId, blockId: null, body, currentUserRole },
      {
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleReply(threadId: string, body: string) {
    createComment.mutate(
      { pageId, blockId: null, body, threadId, currentUserRole },
      {
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleResolve(threadId: string) {
    resolveThread.mutate(
      { threadId, pageId },
      {
        onSuccess: () => toast("Thread resolved"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  if (query.data.length === 0) {
    return (
      <CommentsEmpty
        canComment={canComment}
        onStartDiscussion={handleStartNewThread}
        isSubmitting={createComment.isPending}
      />
    );
  }

  return (
    <CommentsPanelPresenter
      threads={query.data}
      canComment={canComment}
      onReply={handleReply}
      onResolve={handleResolve}
      onStartNewThread={handleStartNewThread}
      isSubmitting={createComment.isPending}
    />
  );
}
