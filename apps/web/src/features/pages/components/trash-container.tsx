import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { trashedPagesQueryOptions } from "../query-options";
import { useRestoreFromTrash } from "../hooks/use-restore-from-trash";
import { useDeletePermanently } from "../hooks/use-delete-permanently";
import { TrashPresenter } from "./trash-presenter";
import { TrashLoading } from "./trash-loading";
import { TrashError } from "./trash-error";
import { TrashEmpty } from "./trash-empty";
import { DeletePermanentlyDialog } from "./delete-permanently-dialog";

interface TrashContainerProps {
  workspaceId: string;
}

export function TrashContainer({ workspaceId }: TrashContainerProps) {
  const query = useQuery(trashedPagesQueryOptions(workspaceId));
  const restoreFromTrash = useRestoreFromTrash();
  const deletePermanently = useDeletePermanently();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (query.isPending) {
    return <TrashLoading />;
  }

  if (query.isError) {
    return (
      <TrashError message={query.error.message} onRetry={() => query.refetch()} />
    );
  }

  if (query.data.length === 0) {
    return <TrashEmpty />;
  }

  function handleRestore(pageId: string) {
    restoreFromTrash.mutate(
      { pageId, workspaceId },
      {
        onSuccess: (page) => toast.success(`${page.title || "Untitled"} restored`),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleConfirmDeletePermanently() {
    if (!pendingDeleteId) return;
    deletePermanently.mutate(
      { pageId: pendingDeleteId, workspaceId },
      {
        onSuccess: () => {
          toast("Page permanently deleted");
          setPendingDeleteId(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  const pendingDeletePage = query.data.find((p) => p.id === pendingDeleteId);

  return (
    <>
      <TrashPresenter
        pages={query.data}
        onRestore={handleRestore}
        onDeletePermanently={setPendingDeleteId}
      />
      <DeletePermanentlyDialog
        open={Boolean(pendingDeleteId)}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
        pageTitle={pendingDeletePage?.title ?? ""}
        onConfirm={handleConfirmDeletePermanently}
        isDeleting={deletePermanently.isPending}
      />
    </>
  );
}
