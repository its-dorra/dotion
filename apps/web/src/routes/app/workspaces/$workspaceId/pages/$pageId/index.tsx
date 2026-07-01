import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageDetailContainer, pageDetailQueryOptions } from "@/features/pages";
import { CommentsSidebar } from "@/features/comments";
import ThemeToggle from "@/components/common/theme-toggle";

export const Route = createFileRoute(
  "/app/workspaces/$workspaceId/pages/$pageId/",
)({
  component: PagePage,
});

function PagePage() {
  const { workspaceId, pageId } = Route.useParams();

  // Resolves the current user's page role for the comments sidebar. Shares
  // a query key (and therefore a cache entry) with PageDetailContainer's own
  // fetch below, so this doesn't cost an extra request.
  const pageQuery = useQuery(pageDetailQueryOptions(pageId));

  const commentsSlot = pageQuery.data ? (
    <CommentsSidebar
      pageId={pageId}
      currentUserRole={pageQuery.data.currentUserRole}
    />
  ) : null;

  return (
    <PageDetailContainer
      workspaceId={workspaceId}
      pageId={pageId}
      themeToggleSlot={<ThemeToggle />}
      commentsSlot={commentsSlot}
    />
  );
}
