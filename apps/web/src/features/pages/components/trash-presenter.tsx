import { TrashedPageRow } from "./trashed-page-row";
import type { TrashedPage } from "../types";

interface TrashPresenterProps {
  pages: TrashedPage[];
  onRestore: (pageId: string) => void;
  onDeletePermanently: (pageId: string) => void;
}

export function TrashPresenter({
  pages,
  onRestore,
  onDeletePermanently,
}: TrashPresenterProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Trash</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Pages here are kept until you delete them permanently.
      </p>
      <div className="divide-y">
        {pages.map((page) => (
          <TrashedPageRow
            key={page.id}
            page={page}
            onRestore={onRestore}
            onDeletePermanently={onDeletePermanently}
          />
        ))}
      </div>
    </div>
  );
}
