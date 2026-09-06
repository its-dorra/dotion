import { FileText, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Can } from '@/features/authorization/components/can'
import type { TrashedPage } from '../types'
import * as m from '@/paraglide/messages'
import type { PageId } from '@dotion/shared/pages/types'

interface TrashedPageRowProps {
  page: TrashedPage
  onRestore: (pageId: string) => void
  onDeletePermanently: (pageId: string) => void
}

export function TrashedPageRow({
  page,
  onRestore,
  onDeletePermanently,
}: TrashedPageRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent">
      {page.icon ? (
        <span className="leading-none">{page.icon}</span>
      ) : (
        <FileText className="h-4 w-4 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {page.title || m.page_untitled()}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Deleted by {page.deletedByName}
        </p>
      </div>
      <Can
        resource={{ type: 'page', id: { pageId: page.id as PageId } }}
        action="restore"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onRestore(page.id)}
          aria-label={m.trash_restore()}
          title={m.trash_restore()}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </Can>
      <Can
        resource={{ type: 'page', id: { pageId: page.id as PageId } }}
        action="deletePermanently"
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={() => onDeletePermanently(page.id)}
          aria-label={m.trash_delete_permanently()}
          title={m.trash_delete_permanently()}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </Can>
    </div>
  )
}
