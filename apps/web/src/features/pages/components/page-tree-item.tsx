import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ChevronRight,
  MoreHorizontal,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Can } from '@/features/authorization/components/can'
import { useCreatePage } from '../hooks/use-create-page'
import { useMoveToTrash } from '../hooks/use-move-to-trash'
import type { PageTreeNodeWithChildren } from '../lib/build-page-tree'
import type { PageId } from '@dotion/shared/pages/types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import * as m from '@/paraglide/messages'

interface PageTreeItemProps {
  node: PageTreeNodeWithChildren
  workspaceId: string
  activePageId?: string
  depth: number
}

export function PageTreeItem({
  node,
  workspaceId,
  activePageId,
  depth,
}: PageTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const createPage = useCreatePage()
  const moveToTrash = useMoveToTrash()

  const isActive = node.id === activePageId
  const showChildren = isExpanded && node.children.length > 0

  function handleCreateChild(parentId: PageId) {
    createPage.mutateAsync({
      workspaceId: workspaceId as WorkspaceId,
      parentId,
      title: '',
    })
    setIsExpanded(true)
  }

  function handleMoveToTrash(pageId: PageId) {
    moveToTrash.mutateAsync({
      pageId,
      workspaceId: workspaceId as WorkspaceId,
    })
  }

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md py-1 pe-1 text-sm hover:bg-accent',
          isActive && 'bg-accent',
        )}
        style={{ paddingInlineStart: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground',
            node.children.length === 0 && 'invisible',
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
          className="flex min-w-0 flex-1 items-center gap-1.5 truncate"
        >
          {node.icon ? (
            <span className="shrink-0 leading-none">{node.icon}</span>
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{node.title || m.page_untitled()}</span>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <Can
            resource="page"
            action="create"
            scope={{ workspaceId: workspaceId as WorkspaceId }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              disabled={createPage.isPending}
              onClick={(event) => {
                event.preventDefault()
                handleCreateChild(node.id)
              }}
              aria-label={m.page_tree_add_page()}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </Can>
          <Can
            resource={{ type: 'page', id: { pageId: node.id } }}
            action="delete"
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  aria-label={m.page_options()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  className="text-destructive"
                  onSelect={() => handleMoveToTrash(node.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  {m.page_move_to_trash()}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Can>
        </div>
      </div>

      {showChildren ? (
        <div>
          {node.children.map((child) => (
            <PageTreeItem
              key={child.id}
              node={child}
              workspaceId={workspaceId}
              activePageId={activePageId}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
