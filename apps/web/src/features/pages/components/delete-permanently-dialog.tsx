import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeletePermanently } from '../hooks/use-delete-permanently'
import * as m from '@/paraglide/messages'
import type { PageId } from '@dotion/shared/pages/types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

interface DeletePermanentlyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pageId: string | null
  pageTitle: string
  workspaceId: string
}

export function DeletePermanentlyDialog({
  open,
  onOpenChange,
  pageId,
  pageTitle: _pageTitle,
  workspaceId,
}: DeletePermanentlyDialogProps) {
  const deletePermanently = useDeletePermanently()

  async function handleConfirm() {
    if (!pageId) return
    await deletePermanently.mutateAsync({
      pageId: pageId as PageId,
      workspaceId: workspaceId as WorkspaceId,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{m.trash_delete_confirm_title()}</DialogTitle>
          <DialogDescription>{m.trash_delete_confirm_desc()}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            {m.common_cancel()}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deletePermanently.isPending || !pageId}
            onClick={handleConfirm}
          >
            {m.trash_delete_permanently()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
