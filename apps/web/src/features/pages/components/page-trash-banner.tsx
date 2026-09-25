import { useState } from 'react'
import { Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Can } from '@/features/authorization/components/can'
import { useRestoreFromTrash } from '../hooks/use-restore-from-trash'
import { DeletePermanentlyDialog } from './delete-permanently-dialog'
import type { PageId } from '@dotion/shared/pages/types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import { m } from '@/paraglide/messages'

interface PageTrashBannerProps {
  workspaceId: WorkspaceId
  pageId: PageId
  pageTitle: string
}

export function PageTrashBanner({
  workspaceId,
  pageId,
  pageTitle,
}: PageTrashBannerProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const restoreFromTrash = useRestoreFromTrash()

  async function handleRestore() {
    await restoreFromTrash.mutateAsync({
      workspaceId,
      pageId,
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-amber-500/10 px-4 py-2.5 text-sm text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <Trash2 className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="font-medium">{m.trash_banner_title()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Can
            permission="page:restore"
            target={{ pageId }}
            workspaceId={workspaceId}
          >
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-amber-600/30 bg-background/80 hover:bg-background text-foreground"
              disabled={restoreFromTrash.isPending}
              onClick={handleRestore}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {m.trash_banner_restore()}
            </Button>
          </Can>
          <Can
            permission="page:deletePermanently"
            target={{ pageId }}
            workspaceId={workspaceId}
          >
            <Button
              size="sm"
              variant="destructive"
              className="h-8"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {m.trash_banner_delete_permanently()}
            </Button>
          </Can>
        </div>
      </div>

      <DeletePermanentlyDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        pageId={pageId}
        pageTitle={pageTitle}
        workspaceId={workspaceId}
      />
    </>
  )
}
