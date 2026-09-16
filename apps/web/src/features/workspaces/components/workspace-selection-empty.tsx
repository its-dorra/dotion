import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { m } from '@/paraglide/messages'

interface WorkspaceSelectionEmptyProps {
  onCreateWorkspace: () => void
}

export function WorkspaceSelectionEmpty({
  onCreateWorkspace,
}: WorkspaceSelectionEmptyProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      {/* Mobile Sidebar Trigger */}
      <div className="mb-6 flex items-center gap-2 md:hidden">
        <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
      </div>

      <Empty className="border-0 py-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Building2 className="size-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle className="text-lg font-medium">
            {m.workspace_selection_empty_title()}
          </EmptyTitle>
          <EmptyDescription className="max-w-sm text-sm">
            {m.workspace_selection_empty_desc()}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={onCreateWorkspace} className="mt-2">
            {m.workspace_create()}
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
