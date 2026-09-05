import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trashedPagesQueryOptions } from '../query-options'
import { useRestoreFromTrash } from '../hooks/use-restore-from-trash'
import { useDeletePermanently } from '../hooks/use-delete-permanently'
import { TrashedPageRow } from './trashed-page-row'
import { TrashEmpty } from './trash-empty'
import { DeletePermanentlyDialog } from './delete-permanently-dialog'
import { SidebarTrigger } from '@/components/ui/sidebar'
import * as m from '@/paraglide/messages'
import type { PageId } from '@dotion/shared/pages/types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

interface TrashProps {
  workspaceId: string
}

export function Trash({ workspaceId }: TrashProps) {
  const { data: pages } = useSuspenseQuery(
    trashedPagesQueryOptions(workspaceId),
  )
  const restoreFromTrash = useRestoreFromTrash()
  const deletePermanently = useDeletePermanently()

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  if (pages.length === 0) {
    return <TrashEmpty />
  }

  async function handleRestore(pageId: string) {
    try {
      const page = await restoreFromTrash.mutateAsync({
        pageId: pageId as PageId,
        workspaceId: workspaceId as WorkspaceId,
      })
      toast.success(
        m.toast_page_restored({ title: page.title || m.page_untitled() }),
      )
    } catch (error: any) {
      toast.error(error?.message ?? m.toast_page_restore_failed())
    }
  }

  async function handleConfirmDeletePermanently() {
    if (!pendingDeleteId) return
    try {
      await deletePermanently.mutateAsync({
        pageId: pendingDeleteId as PageId,
        workspaceId: workspaceId as WorkspaceId,
      })
      toast(m.toast_page_deleted_permanently())
      setPendingDeleteId(null)
    } catch (error: any) {
      toast.error(error?.message ?? m.toast_page_delete_failed())
    }
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
            onRestore={handleRestore}
            onDeletePermanently={setPendingDeleteId}
          />
        ))}
      </div>
      <DeletePermanentlyDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null)
        }}
        pageTitle={pendingDeletePage?.title ?? ''}
        onConfirm={handleConfirmDeletePermanently}
        isDeleting={deletePermanently.isPending}
      />
    </div>
  )
}
