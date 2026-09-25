import { useState, useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { trashedPagesQueryOptions } from '../query-options'
import { TrashedPageTreeItem } from './trashed-page-tree-item'
import { TrashEmpty } from './trash-empty'
import { DeletePermanentlyDialog } from './delete-permanently-dialog'
import { EmptyTrashDialog } from './empty-trash-dialog'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Can } from '@/features/authorization/components/can'
import { buildTrashTree } from '../lib/build-page-tree'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import { m } from '@/paraglide/messages'
import type { PageId } from '../types'

interface TrashProps {
  workspaceId: WorkspaceId
}

export function Trash({ workspaceId }: TrashProps) {
  const { data: pages } = useSuspenseQuery(
    trashedPagesQueryOptions(workspaceId),
  )

  const [pendingDeleteId, setPendingDeleteId] = useState<PageId | null>(null)
  const [isEmptyTrashOpen, setIsEmptyTrashOpen] = useState(false)

  const tree = useMemo(() => buildTrashTree(pages), [pages])

  if (pages.length === 0) {
    return <TrashEmpty />
  }

  const pendingDeletePage = pages.find((p) => p.id === pendingDeleteId)

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground md:hidden" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {m.trash_title()}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {m.trash_description()}
            </p>
          </div>
        </div>
        <Can
          permission="page:emptyTrash"
          container={{ workspaceId: workspaceId as WorkspaceId }}
        >
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsEmptyTrashOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {m.trash_empty_button()}
          </Button>
        </Can>
      </div>

      <div className="space-y-0.5 rounded-lg border bg-card p-2 shadow-sm">
        {tree.map((node) => (
          <TrashedPageTreeItem
            key={node.id}
            node={node}
            workspaceId={workspaceId}
            depth={0}
            onDeletePermanently={setPendingDeleteId}
          />
        ))}
      </div>

      <DeletePermanentlyDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        pageId={pendingDeleteId}
        pageTitle={pendingDeletePage?.title ?? ''}
        workspaceId={workspaceId}
      />

      <EmptyTrashDialog
        open={isEmptyTrashOpen}
        onOpenChange={setIsEmptyTrashOpen}
        workspaceId={workspaceId}
      />
    </div>
  )
}
