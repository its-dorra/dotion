import { useState, memo } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronRight, FileText, RotateCcw, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Can } from '@/features/authorization/components/can'
import { useRestoreFromTrash } from '../hooks/use-restore-from-trash'
import type { TrashedPageTreeNode } from '../lib/build-page-tree'
import type { PageId } from '@dotion/shared/pages/types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import * as m from '@/paraglide/messages'

interface TrashedPageTreeItemProps {
  node: TrashedPageTreeNode
  workspaceId: string
  activePageId?: string
  depth: number
  onDeletePermanently: (pageId: string) => void
}

export const TrashedPageTreeItem = memo(function TrashedPageTreeItem({
  node,
  workspaceId,
  activePageId,
  depth,
  onDeletePermanently,
}: TrashedPageTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const restoreFromTrash = useRestoreFromTrash()

  const isActive = node.id === activePageId
  const hasChildren = node.children.length > 0
  const showChildren = isExpanded && hasChildren

  async function handleRestore(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    await restoreFromTrash.mutateAsync({
      pageId: node.id as PageId,
      workspaceId: workspaceId as WorkspaceId,
    })
  }

  function handleDeletePermanently(event: React.MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    onDeletePermanently(node.id)
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md py-1.5 pe-2 text-sm hover:bg-accent/60 transition-colors',
          isActive && 'bg-accent',
        )}
        style={{ paddingInlineStart: `${depth * 16 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground transition-colors',
            !hasChildren && 'invisible pointer-events-none',
          )}
          aria-label={isExpanded ? m.common_collapse() : m.common_expand()}
        >
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 transition-transform rtl:rotate-180',
              isExpanded && 'rotate-90 rtl:rotate-90',
            )}
          />
        </button>

        <Link
          to="/app/workspaces/$workspaceId/pages/$pageId"
          params={{ workspaceId, pageId: node.id }}
          className="flex min-w-0 flex-1 items-center gap-2 truncate py-0.5"
          preload="viewport"
        >
          {node.icon ? (
            <span className="shrink-0 text-base leading-none">{node.icon}</span>
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate font-medium text-foreground">
            {node.title || m.page_untitled()}
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Can
            resource={{ type: 'page', id: { pageId: node.id as PageId } }}
            action="restore"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              disabled={restoreFromTrash.isPending}
              onClick={handleRestore}
              aria-label={m.trash_restore()}
              title={m.trash_restore()}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </Can>
          <Can
            resource={{ type: 'page', id: { pageId: node.id as PageId } }}
            action="deletePermanently"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleDeletePermanently}
              aria-label={m.trash_delete_permanently()}
              title={m.trash_delete_permanently()}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </Can>
        </div>
      </div>

      {showChildren ? (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <TrashedPageTreeItem
              key={child.id}
              node={child}
              workspaceId={workspaceId}
              activePageId={activePageId}
              depth={depth + 1}
              onDeletePermanently={onDeletePermanently}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
})
