import { Link } from '@tanstack/react-router'
import { Building2, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { PageTreeContainer } from '@/features/pages/components/page-tree-container'
import { WorkspaceIcon } from '@/features/workspaces/components/workspace-icon'
import { workspacesListQueryOptions } from '@/features/workspaces/query-options'
import { cn } from '@/lib/utils'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import * as m from '@/paraglide/messages'

import { SearchTrigger } from '@/features/search/components/search-trigger'

interface HomePanelProps {
  workspaceId?: WorkspaceId
  activePageId?: string
  isTrashActive?: boolean
}

export function HomePanel({
  workspaceId,
  activePageId,
  isTrashActive,
}: HomePanelProps) {
  const workspacesQuery = useQuery(workspacesListQueryOptions())
  const workspaces = workspacesQuery.data ?? []

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent('dotion:open-search'))
  }

  if (!workspaceId) {
    if (workspaces.length > 0) {
      return (
        <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-1 py-2">
          <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
            {m.workspace_switcher_title()}
          </p>
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              to="/app/workspaces/$workspaceId"
              params={{ workspaceId: ws.id }}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-foreground"
            >
              <WorkspaceIcon icon={ws.icon} name={ws.name} size="sm" />
              <span className="truncate">{ws.name}</span>
            </Link>
          ))}
        </div>
      )
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center text-sm text-muted-foreground">
        <Building2 className="mb-2 size-8 text-muted-foreground/40" />
        <p className="text-xs font-medium text-foreground">
          {m.workspace_selection_empty_title()}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">
          {m.workspace_selection_empty_desc()}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-1 py-2 gap-2">
      <div className="px-1">
        <SearchTrigger onClick={handleOpenSearch} />
      </div>
      <PageTreeContainer
        workspaceId={workspaceId}
        activePageId={activePageId}
      />
      <div className="mt-auto pt-2">
        <Link
          to="/app/workspaces/$workspaceId/trash"
          params={{ workspaceId }}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            isTrashActive && 'bg-accent text-foreground',
          )}
        >
          <Trash2 className="h-4 w-4" />
          {m.trash_title()}
        </Link>
      </div>
    </div>
  )
}
