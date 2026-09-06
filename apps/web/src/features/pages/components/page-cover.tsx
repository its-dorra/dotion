import { ImageIcon, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CoverPicker } from './cover/cover-picker'
import * as m from '@/paraglide/messages'

export { CoverPicker as CoverPickerDialog } from './cover/cover-picker'

interface PageCoverProps {
  cover?: string | null
  onChangeCover: (cover: string | null) => void
  readOnly?: boolean
}

export function PageCover({
  cover,
  onChangeCover,
  readOnly = false,
}: PageCoverProps) {
  if (!cover) {
    return null
  }

  return (
    <div className="group/cover relative h-48 w-full overflow-hidden sm:h-64 select-none bg-muted">
      <img
        src={cover}
        alt={m.page_cover_alt()}
        className="h-full w-full object-cover transition-opacity duration-300"
      />
      {!readOnly ? (
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-4 opacity-100 sm:opacity-0 sm:transition-opacity sm:duration-150 sm:group-hover/cover:opacity-100 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm p-1 rounded-md z-20">
          <CoverPicker cover={cover} onSelect={onChangeCover}>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 h-7 px-2.5 text-xs shadow-sm bg-background/90 hover:bg-background cursor-pointer"
            >
              <Pencil className="h-3 w-3" />
              {m.page_change_cover()}
            </Button>
          </CoverPicker>
          <Button
            variant="secondary"
            size="icon"
            className="gap-1.5 h-7 px-2 text-xs shadow-sm bg-background/90 hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
            onClick={() => onChangeCover(null)}
            title={m.common_remove()}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ) : null}
    </div>
  )
}

interface AddCoverButtonProps {
  onAddCover: (cover: string) => void
}

export function AddCoverButton({ onAddCover }: AddCoverButtonProps) {
  return (
    <CoverPicker
      onSelect={(url) => {
        if (url) onAddCover(url)
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground h-7 px-2 text-xs cursor-pointer"
      >
        <ImageIcon className="h-3.5 w-3.5" />
        {m.page_add_cover()}
      </Button>
    </CoverPicker>
  )
}
