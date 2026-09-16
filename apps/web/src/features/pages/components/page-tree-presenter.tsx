import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTreeItem } from './page-tree-item'
import { Can } from '@/features/authorization/components/can'
import { useCreatePage } from '../hooks/use-create-page'
import type { PageTreeNodeWithChildren } from '../lib/build-page-tree'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import { m } from '@/paraglide/messages'

interface PageTreePresenterProps {
  tree: PageTreeNodeWithChildren[]
  workspaceId: string
  activePageId?: string
}

export function PageTreePresenter({
  tree,
  workspaceId,
  activePageId,
}: PageTreePresenterProps) {
  const createPage = useCreatePage()

  function handleCreateRootPage() {
    createPage.mutateAsync({
      workspaceId: workspaceId as WorkspaceId,
      parentId: undefined,
      title: '',
    })
  }

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-medium text-muted-foreground">
          {m.page_tree_title()}
        </span>
        <Can
          resource="page"
          action="create"
          container={{ workspaceId: workspaceId as WorkspaceId }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            disabled={createPage.isPending}
            onClick={handleCreateRootPage}
            aria-label={m.page_tree_add_page()}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </Can>
      </div>
      {tree.map((node) => (
        <PageTreeItem
          key={node.id}
          node={node}
          workspaceId={workspaceId}
          activePageId={activePageId}
          depth={0}
        />
      ))}
    </div>
  )
}
