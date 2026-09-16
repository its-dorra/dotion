import { useState } from 'react'
import { EmojiPicker } from '@ferrucc-io/emoji-picker'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Smile, Trash2 } from 'lucide-react'
import { m } from '@/paraglide/messages'

interface PageIconPickerProps {
  icon?: string | null
  onChange: (icon: string | null) => void
  readOnly?: boolean
  children?: React.ReactNode
}

export function PageIconPicker({
  icon,
  onChange,
  readOnly = false,
  children,
}: PageIconPickerProps) {
  const [open, setOpen] = useState(false)

  function handleRemove() {
    onChange(null)
    setOpen(false)
  }

  if (readOnly) {
    if (!icon) return null
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-5xl leading-none select-none">
        {icon}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <button
            type="button"
            className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted text-5xl leading-none transition-transform hover:scale-105 hover:bg-muted/80 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={m.page_change_icon()}
          >
            {icon ?? '📄'}
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-85 p-0 shadow-xl border bg-popover overflow-hidden"
      >
        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {m.page_icon_emoji_title()}
          </span>
          <div className="flex items-center gap-1">
            {icon ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                onClick={handleRemove}
                title={m.common_remove()}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {m.common_remove()}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="p-1">
          <EmojiPicker
            emojisPerRow={9}
            emojiSize={28}
            onEmojiSelect={(selectedEmoji) => {
              onChange(selectedEmoji)
              setOpen(false)
            }}
            className="w-full border-none shadow-none bg-transparent"
          >
            <EmojiPicker.Header className="p-2 pb-1">
              <EmojiPicker.Input
                placeholder={m.page_icon_emoji_search()}
                autoFocus
                className="h-8 text-sm bg-muted/40"
              />
            </EmojiPicker.Header>
            <EmojiPicker.Group>
              <EmojiPicker.List containerHeight={280} />
            </EmojiPicker.Group>
          </EmojiPicker>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface AddIconButtonProps {
  onAddIcon: (icon: string) => void
}

export function AddIconButton({ onAddIcon }: AddIconButtonProps) {
  return (
    <PageIconPicker
      onChange={(icon) => {
        if (icon) onAddIcon(icon)
      }}
    >
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
      >
        <Smile className="h-3.5 w-3.5" />
        {m.page_add_icon()}
      </Button>
    </PageIconPicker>
  )
}
