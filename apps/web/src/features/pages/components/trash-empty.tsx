import { Trash2 } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { m } from '@/paraglide/messages'

export function TrashEmpty() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      {/* Mobile Sidebar Trigger */}
      <div className="mb-6 flex items-center gap-2 md:hidden">
        <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
      </div>

      <Empty className="border-0 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Trash2 className="size-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle className="text-lg font-medium">
            {m.trash_empty()}
          </EmptyTitle>
          <EmptyDescription className="max-w-sm text-sm">
            {m.trash_empty_desc()}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}
