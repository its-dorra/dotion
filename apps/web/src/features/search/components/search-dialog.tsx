import { useIsMobile } from '@/hooks/use-mobile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SearchContent } from './search-content'
import { SearchSheet } from './search-sheet'
import * as m from '@/paraglide/messages'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

export interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId?: WorkspaceId
}

export function SearchDesktopDialog({
  open,
  onOpenChange,
  workspaceId,
}: SearchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl gap-0 p-0 overflow-hidden border shadow-2xl sm:rounded-xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{m.search_dialog_title()}</DialogTitle>
        </DialogHeader>
        <SearchContent
          variant="dialog"
          workspaceId={workspaceId}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

export function SearchDialog(props: SearchDialogProps) {
  const isMobile = useIsMobile()
  return isMobile ? (
    <SearchSheet {...props} />
  ) : (
    <SearchDesktopDialog {...props} />
  )
}

export { SearchDialog as SearchModal }
