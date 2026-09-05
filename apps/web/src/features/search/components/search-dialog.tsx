import * as React from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  FileText,
  Hash,
  Loader2,
  CornerDownLeft,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { searchQueryOptions } from '../query-options'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { SearchResultItem } from '../types'
import { cn } from '@/lib/utils'

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId?: WorkspaceId
}

export function SearchDialog({
  open,
  onOpenChange,
  workspaceId: propWorkspaceId,
}: SearchDialogProps) {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const workspaceId =
    propWorkspaceId ?? (params.workspaceId as WorkspaceId | undefined)

  const [searchQuery, setSearchQuery] = React.useState('')
  const [debouncedQuery, setDebouncedQuery] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Debounce query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset selected index on query change
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [debouncedQuery])

  // Reset search when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setSearchQuery('')
      setDebouncedQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  const {
    data: results,
    isPending,
    isFetching,
  } = useQuery(
    searchQueryOptions(workspaceId as WorkspaceId, debouncedQuery, {
      enabled: Boolean(workspaceId && debouncedQuery.trim().length > 0),
    }),
  )

  const items = React.useMemo<SearchResultItem[]>(
    () => results ?? [],
    [results],
  )

  const handleSelectResult = React.useCallback(
    (item: SearchResultItem) => {
      if (!workspaceId) return
      onOpenChange(false)

      const hash = item.headingBlockId ? `#${item.headingBlockId}` : ''

      navigate({
        to: `/app/workspaces/$workspaceId/pages/$pageId`,
        params: {
          workspaceId,
          pageId: item.pageId,
        },
      }).then(() => {
        if (hash) {
          setTimeout(() => {
            const el = document.getElementById(item.headingBlockId!)
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
          }, 300)
        }
      })
    },
    [workspaceId, onOpenChange, navigate],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (items.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[selectedIndex]
      if (item) {
        handleSelectResult(item)
      }
    }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    const words = query
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 1)
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    if (words.length === 0) return text

    const regex = new RegExp(`(${words.join('|')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-primary/20 text-primary font-medium rounded-xs px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl gap-0 p-0 overflow-hidden border shadow-2xl sm:rounded-xl"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search Workspace</DialogTitle>
        </DialogHeader>

        {/* Search Header Input */}
        <div className="flex items-center border-b px-3.5 py-2.5 gap-2.5 bg-background">
          <Search className="size-4.5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search documents, sections, and notes... (e.g. roadmap, database schema)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 text-sm h-8 px-0 placeholder:text-muted-foreground/70"
          />
          {isFetching && (
            <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />
          )}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Results Area */}
        <ScrollArea className="max-h-[380px] p-2 min-h-[140px]">
          {debouncedQuery.trim() === '' ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              <Search className="size-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium text-foreground/80">
                Hybrid Workspace Search
              </p>
              <p className="mt-1">
                Type keywords to perform semantic and keyword retrieval across
                all pages.
              </p>
            </div>
          ) : isPending && items.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <Loader2 className="size-6 mx-auto mb-2 animate-spin text-primary" />
              Searching workspace knowledge base...
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">
              <p className="font-medium text-foreground/80">No results found</p>
              <p className="mt-1">
                Try searching for different keywords or checking for typos.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, index) => {
                const isSelected = index === selectedIndex
                return (
                  <div
                    key={`${item.pageId}-${item.headingBlockId ?? index}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'group flex flex-col gap-1 rounded-lg p-2.5 text-left text-xs transition-colors cursor-pointer border border-transparent',
                      isSelected
                        ? 'bg-accent text-accent-foreground border-border/50 shadow-xs'
                        : 'hover:bg-accent/50',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 font-medium text-foreground">
                        <FileText className="size-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{item.pageTitle}</span>
                        {item.sectionTitle &&
                          item.sectionTitle !== item.pageTitle && (
                            <>
                              <span className="text-muted-foreground/60 text-[10px]">
                                &gt;
                              </span>
                              <span className="flex items-center gap-0.5 text-muted-foreground truncate">
                                <Hash className="size-3 shrink-0" />
                                {item.sectionTitle}
                              </span>
                            </>
                          )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.score !== undefined && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-mono px-1.5 py-0 h-4 bg-muted/60"
                          >
                            Score: {item.score.toFixed(3)}
                          </Badge>
                        )}
                        {isSelected && (
                          <CornerDownLeft className="size-3 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <p className="line-clamp-2 text-[11px] text-muted-foreground/90 font-normal leading-relaxed pl-5">
                      {highlightMatch(item.content, debouncedQuery)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded-xs border bg-background px-1 py-0.5 text-[10px] font-mono shadow-2xs">
                ↑
              </kbd>
              <kbd className="rounded-xs border bg-background px-1 py-0.5 text-[10px] font-mono shadow-2xs">
                ↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-xs border bg-background px-1.5 py-0.5 text-[10px] font-mono shadow-2xs">
                ↵
              </kbd>
              <span>Open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-xs border bg-background px-1 py-0.5 text-[10px] font-mono shadow-2xs">
                Esc
              </kbd>
              <span>Close</span>
            </span>
          </div>
          <span className="font-medium text-[10px]">
            Lakebase BM25 + Gemini Vector
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
