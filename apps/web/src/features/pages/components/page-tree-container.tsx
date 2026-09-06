import { useQuery } from '@tanstack/react-query'
import { pageTreeQueryOptions } from '../query-options'
import { buildPageTree } from '../lib/build-page-tree'
import { PageTreePresenter } from './page-tree-presenter'
import { PageTreeLoading } from './page-tree-loading'
import { PageTreeError } from './page-tree-error'
import { PageTreeEmpty } from './page-tree-empty'
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
    return <PageTreeEmpty workspaceId={workspaceId} />
  }

  return (
    <PageTreePresenter
      tree={buildPageTree(query.data)}
      workspaceId={workspaceId}
      activePageId={activePageId}
    />
  )
}
