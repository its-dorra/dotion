import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchTriggerProps {
  onClick: () => void
  className?: string
}

export function SearchTrigger({ onClick, className }: SearchTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex h-8 w-full items-center justify-between rounded-md border border-input bg-background/50 px-2.5 text-xs text-muted-foreground shadow-2xs transition-colors hover:bg-accent hover:text-accent-foreground',
        className,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Search className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
        <span className="truncate">Search workspace...</span>
      </div>
      <kbd className="pointer-events-none hidden h-4.5 select-none items-center gap-0.5 rounded-xs border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-90 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}
