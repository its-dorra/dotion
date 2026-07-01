import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { pageTreeQueryOptions } from "../query-options";
import { useCreatePage } from "../hooks/use-create-page";
import { useMoveToTrash } from "../hooks/use-move-to-trash";
import { useRenamePage } from "../hooks/use-rename-page";
import { buildPageTree } from "../lib/build-page-tree";
import { PageTreePresenter } from "./page-tree-presenter";
import { PageTreeLoading } from "./page-tree-loading";
import { PageTreeError } from "./page-tree-error";
import { PageTreeEmpty } from "./page-tree-empty";

interface PageTreeContainerProps {
  workspaceId: string;
  activePageId?: string;
}

export function PageTreeContainer({
  workspaceId,
  activePageId,
}: PageTreeContainerProps) {
  const navigate = useNavigate();
  const query = useQuery(pageTreeQueryOptions(workspaceId));
  const createPage = useCreatePage();
  const moveToTrash = useMoveToTrash();
  const renamePage = useRenamePage();

  function handleCreatePage(parentId: string | null) {
    createPage.mutate(
      { workspaceId, parentId },
      {
        onSuccess: (page) => {
          navigate({
            to: "/app/workspaces/$workspaceId/pages/$pageId",
            params: { workspaceId, pageId: page.id },
          });
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleMoveToTrash(pageId: string) {
    moveToTrash.mutate(
      { pageId, workspaceId },
      {
        onSuccess: () => toast("Moved to trash"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleRenamePage(pageId: string, title: string) {
    renamePage.mutate(
      { pageId, title },
      {
        onError: (error) => toast.error(error.message),
      },
    );
  }

  if (query.isPending) {
    return <PageTreeLoading />;
  }

  if (query.isError) {
    return (
      <PageTreeError message={query.error.message} onRetry={() => query.refetch()} />
    );
  }

  if (query.data.length === 0) {
    return <PageTreeEmpty onCreateFirstPage={() => handleCreatePage(null)} />;
  }

  return (
    <PageTreePresenter
      tree={buildPageTree(query.data)}
      workspaceId={workspaceId}
      activePageId={activePageId}
      onCreateRootPage={() => handleCreatePage(null)}
      onCreateChild={(parentId) => handleCreatePage(parentId)}
      onMoveToTrash={handleMoveToTrash}
      onRenamePage={handleRenamePage}
    />
  );
}
