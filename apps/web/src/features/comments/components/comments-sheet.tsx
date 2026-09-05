import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { CommentsContainer } from './comments-container'
import type { WorkspaceId } from '@/features/workspaces/types'
import type { PageId } from '@dotion/shared/pages/types'
import type { PagePermissionRole } from '@/features/pages/types'

interface CommentsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: WorkspaceId
  pageId: PageId
  currentUserRole: PagePermissionRole
}

export function CommentsSheet({
  open,
  onOpenChange,
  workspaceId,
  pageId,
  currentUserRole,
}: CommentsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="sr-only">
          <SheetTitle>Comments</SheetTitle>
        </SheetHeader>
        <div className="h-full">
          <CommentsContainer
            workspaceId={workspaceId}
            pageId={pageId}
            currentUserRole={currentUserRole}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
