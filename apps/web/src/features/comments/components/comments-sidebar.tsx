import { memo } from 'react'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import { CommentsContainer } from './comments-container'
import type { PagePermissionRole } from '@/features/pages/types'
import type { PageId } from '@dotion/shared/pages/types'

interface CommentsSidebarProps {
  workspaceId: WorkspaceId
  pageId: PageId
  currentUserRole: PagePermissionRole
}

export const CommentsSidebar = memo(function CommentsSidebar({
  workspaceId,
  pageId,
  currentUserRole,
}: CommentsSidebarProps) {
  return (
    <aside className="hidden w-80 shrink-0 border-l lg:block">
      <CommentsContainer
        workspaceId={workspaceId}
        pageId={pageId}
        currentUserRole={currentUserRole}
      />
    </aside>
  )
})
