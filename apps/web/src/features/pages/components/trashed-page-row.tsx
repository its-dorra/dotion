import { FileText, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrashedPage } from "../types";

interface TrashedPageRowProps {
  page: TrashedPage;
  onRestore: (pageId: string) => void;
  onDeletePermanently: (pageId: string) => void;
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
        <p className="truncate text-sm font-medium">{page.title || "Untitled"}</p>
        <p className="truncate text-xs text-muted-foreground">
          Deleted by {page.deletedByName}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => onRestore(page.id)}
        aria-label="Restore page"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => onDeletePermanently(page.id)}
        aria-label="Delete permanently"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
