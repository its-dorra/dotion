import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SearchContent } from './search-content'
import * as m from '@/paraglide/messages'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

export interface SearchSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId?: WorkspaceId
}

export function SearchSheet({
  open,
  onOpenChange,
  workspaceId,
}: SearchSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[88dvh] max-h-[92dvh] p-0 flex flex-col gap-0 rounded-t-2xl overflow-hidden bg-background border-t shadow-2xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{m.search_dialog_title()}</SheetTitle>
        </SheetHeader>
        <SearchContent
          variant="sheet"
          workspaceId={workspaceId}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
