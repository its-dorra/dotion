import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageTreeEmptyProps {
  onCreateFirstPage: () => void;
}

export function PageTreeEmpty({ onCreateFirstPage }: PageTreeEmptyProps) {
  return (
    <div className="flex flex-col items-start gap-2 px-2 py-3">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        No pages yet
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 px-2 text-muted-foreground"
        onClick={onCreateFirstPage}
      >
        <Plus className="h-3.5 w-3.5" />
        Create first page
      </Button>
    </div>
  );
}
