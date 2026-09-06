import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { trashedPagesQueryOptions } from '../query-options'
import { TrashedPageRow } from './trashed-page-row'
import { TrashEmpty } from './trash-empty'
import { DeletePermanentlyDialog } from './delete-permanently-dialog'
import { SidebarTrigger } from '@/components/ui/sidebar'
import * as m from '@/paraglide/messages'

interface TrashProps {
  workspaceId: string
}

export function Trash({ workspaceId }: TrashProps) {
  const { data: pages } = useSuspenseQuery(
    trashedPagesQueryOptions(workspaceId),
  )

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  if (pages.length === 0) {
    return <TrashEmpty />
  }

  const pendingDeletePage = pages.find((p) => p.id === pendingDeleteId)

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground md:hidden" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {m.trash_title()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {m.trash_description()}
          </p>
        </div>
      </div>
      <div className="divide-y">
        {pages.map((page) => (
          <TrashedPageRow
            key={page.id}
            page={page}
            workspaceId={workspaceId}
            onDeletePermanently={setPendingDeleteId}
          />
        ))}
      </div>
      <DeletePermanentlyDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        pageId={pendingDeleteId}
        pageTitle={pendingDeletePage?.title ?? ''}
        workspaceId={workspaceId}
      />
    </div>
  )
}
