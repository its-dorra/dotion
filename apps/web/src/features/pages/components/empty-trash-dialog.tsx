import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useEmptyTrash } from '../hooks/use-empty-trash'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

interface EmptyTrashDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
}

export function EmptyTrashDialog({
  open,
  onOpenChange,
  workspaceId,
}: EmptyTrashDialogProps) {
  const emptyTrash = useEmptyTrash()

  async function handleConfirm() {
    await emptyTrash.mutateAsync({
      workspaceId: workspaceId as WorkspaceId,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{m.trash_empty_confirm_title()}</DialogTitle>
          <DialogDescription>{m.trash_empty_confirm_desc()}</DialogDescription>
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
            disabled={emptyTrash.isPending}
            onClick={handleConfirm}
          >
            {m.trash_empty_button()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
