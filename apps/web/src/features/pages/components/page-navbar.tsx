import { LastEditedIndicator } from './last-edited-indicator'
import { ShareDropdownContainer } from './share-dropdown-container'
import { RequestAccessButton } from './request-access-button'
import { Can } from '@/features/authorization/components/can'
import type { Page } from '../types'
import { CollaboratorsList } from './collaborators-list'
import type { CollaborativeUser } from '../hooks/use-page-awareness'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { MessageSquare } from 'lucide-react'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '@/features/workspaces/types'

interface PageNavbarProps {
  page: Page
  workspaceName: string
  workspaceId: WorkspaceId
  collaborators?: CollaborativeUser[]
  onOpenComments?: () => void
}

export function PageNavbar({
  page,
  workspaceName: _workspaceName,
  workspaceId,
  collaborators = [],
  onOpenComments,
}: PageNavbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
      </div>
      <div className="flex shrink-0 items-center gap-3 ms-auto">
        <CollaboratorsList users={collaborators} />
        <div className="flex items-center gap-2">
          <LastEditedIndicator lastEditedAt={page.updatedAt} />

          <Can
            resource={{ type: 'page', id: { pageId: page.id } }}
            action="update"
          >
            {(canUpdate) =>
              !canUpdate ? (
                <RequestAccessButton
                  workspaceId={workspaceId as WorkspaceId}
                  pageId={page.id}
                />
              ) : null
            }
          </Can>

          {onOpenComments && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={onOpenComments}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{m.comments_title()}</span>
            </Button>
          )}

          <Can
            resource={{ type: 'page', id: { pageId: page.id } }}
            action="share"
          >
            <ShareDropdownContainer page={page} />
          </Can>
        </div>
      </div>
    </header>
  )
}
