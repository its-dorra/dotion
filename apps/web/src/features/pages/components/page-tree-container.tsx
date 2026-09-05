import { useQuery } from '@tanstack/react-query'
import { pageTreeQueryOptions } from '../query-options'
import { useCreatePage } from '../hooks/use-create-page'
import { useMoveToTrash } from '../hooks/use-move-to-trash'
import { buildPageTree } from '../lib/build-page-tree'
import { PageTreePresenter } from './page-tree-presenter'
import { PageTreeLoading } from './page-tree-loading'
import { PageTreeError } from './page-tree-error'
import { PageTreeEmpty } from './page-tree-empty'
import type { PageId } from '@dotion/shared/pages/types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

interface PageTreeContainerProps {
  workspaceId: WorkspaceId
  activePageId?: string
}

export function PageTreeContainer({
  workspaceId,
  activePageId,
}: PageTreeContainerProps) {
  const query = useQuery(pageTreeQueryOptions(workspaceId))
  const createPage = useCreatePage()
  const moveToTrash = useMoveToTrash()

  function handleCreatePage(parentId: PageId | undefined) {
    return createPage.mutateAsync({ workspaceId, parentId, title: '' })
  }

  function handleMoveToTrash(pageId: string) {
    return moveToTrash.mutateAsync({
      pageId: pageId as PageId,
      workspaceId,
    })
  }

  if (query.isPending) {
    return <PageTreeLoading />
  }

  if (query.isError) {
    return (
      <PageTreeError
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    )
  }

  if (query.data.length === 0) {
    return (
      <PageTreeEmpty onCreateFirstPage={() => handleCreatePage(undefined)} />
    )
  }

  return (
    <PageTreePresenter
      tree={buildPageTree(query.data)}
      workspaceId={workspaceId}
      activePageId={activePageId}
      onCreateRootPage={() => handleCreatePage(undefined)}
      onCreateChild={handleCreatePage}
      onMoveToTrash={handleMoveToTrash}
    />
  )
}
