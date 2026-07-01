import { useQuery } from "@tanstack/react-query";
import { pageDetailQueryOptions } from "../query-options";
import { workspaceDetailQueryOptions } from "@/features/workspaces/query-options";
import { PageDetailPresenter } from "./page-detail-presenter";
import { PageDetailLoading } from "./page-detail-loading";
import { PageDetailError } from "./page-detail-error";

interface PageDetailContainerProps {
  workspaceId: string;
  pageId: string;
  themeToggleSlot?: React.ReactNode;
  commentsSlot?: React.ReactNode;
}

// Placeholder callbacks for fields that will be driven by realtime sync
// (WebSockets/Yjs) once that layer exists. They're wired through the
// component tree now so adding real-time behavior later won't change
// any component's props contract. Title changes belong here too — once a
// page is open for editing, further edits to its title are exactly the
// kind of live, continuous update realtime sync owns, not a traditional
// request/response mutation.
const onPageTitleChange = () => {};
const onPageIconChange = () => {};
const onPageCoverChange = () => {};
const onDocumentChange = () => {};

export function PageDetailContainer({
  workspaceId,
  pageId,
  themeToggleSlot,
  commentsSlot,
}: PageDetailContainerProps) {
  const pageQuery = useQuery(pageDetailQueryOptions(pageId));
  const workspaceQuery = useQuery(workspaceDetailQueryOptions(workspaceId));

  if (pageQuery.isPending || workspaceQuery.isPending) {
    return <PageDetailLoading />;
  }

  if (pageQuery.isError) {
    return (
      <PageDetailError
        message={pageQuery.error.message}
        workspaceId={workspaceId}
        onRetry={() => pageQuery.refetch()}
      />
    );
  }

  if (workspaceQuery.isError) {
    return (
      <PageDetailError
        message={workspaceQuery.error.message}
        workspaceId={workspaceId}
        onRetry={() => workspaceQuery.refetch()}
      />
    );
  }

  const page = pageQuery.data;
  const workspace = workspaceQuery.data;

  return (
    <PageDetailPresenter
      page={page}
      workspaceName={workspace.name}
      workspaceId={workspaceId}
      themeToggleSlot={themeToggleSlot}
      commentsSlot={commentsSlot}
      onTitleChange={onPageTitleChange}
      onIconChange={onPageIconChange}
      onCoverChange={onPageCoverChange}
      onDocumentChange={onDocumentChange}
    />
  );
}
