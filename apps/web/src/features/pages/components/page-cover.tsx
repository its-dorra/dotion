import { ImageIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageCoverProps {
  coverImageUrl?: string;
  onChangeCover: () => void;
}

export function PageCover({ coverImageUrl, onChangeCover }: PageCoverProps) {
  if (!coverImageUrl) {
    return null;
  }

  return (
    <div className="group relative h-48 w-full overflow-hidden sm:h-64">
      <img
        src={coverImageUrl}
        alt=""
        className="h-full w-full object-cover"
      />
      <div className="absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 shadow"
          onClick={onChangeCover}
        >
          <Pencil className="h-3.5 w-3.5" />
          Change cover
        </Button>
      </div>
    </div>
  );
}

interface AddCoverButtonProps {
  onAddCover: () => void;
}

export function AddCoverButton({ onAddCover }: AddCoverButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 text-muted-foreground"
      onClick={onAddCover}
    >
      <ImageIcon className="h-3.5 w-3.5" />
      Add cover
    </Button>
  );
}
