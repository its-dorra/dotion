import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useCreatePage } from '../hooks/use-create-page'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import * as m from '@/paraglide/messages'

interface PageTreeEmptyProps {
  workspaceId: WorkspaceId
}

export function PageTreeEmpty({ workspaceId }: PageTreeEmptyProps) {
  const createPage = useCreatePage()

  function handleCreateFirstPage() {
    createPage.mutateAsync({ workspaceId, parentId: undefined, title: '' })
  }

  return (
    <Empty className="border-0 p-4">
      <EmptyHeader className="gap-1.5">
        <EmptyMedia variant="icon">
          <FileText className="size-4 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle className="text-xs font-medium">
          {m.page_tree_empty_title()}
        </EmptyTitle>
        <EmptyDescription className="text-[11px]">
          {m.page_tree_empty_desc()}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs"
          disabled={createPage.isPending}
          onClick={handleCreateFirstPage}
        >
          <Plus className="size-3.5" />
          {m.page_tree_create_first()}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
