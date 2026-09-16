import * as React from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useDebouncedValue } from '@tanstack/react-pacer'
import { Search, Loader2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { InfiniteScroll } from '@/components/ui/infinite-scroll'
import { m } from '@/paraglide/messages'
import { searchInfiniteQueryOptions } from '../query-options'
import { SearchModeSelector } from './search-mode-selector'
import { SearchResultItem } from './search-result-item'
import type {
  SearchResultItem as SearchResultItemType,
  SearchMode,
} from '../types'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'

interface SearchContentProps {
  variant: 'dialog' | 'sheet'
  workspaceId?: WorkspaceId
  onClose: () => void
}

export function SearchContent({
  variant,
  workspaceId: propWorkspaceId,
  onClose,
}: SearchContentProps) {
  const params = useParams({ strict: false })
  const navigate = useNavigate()
  const workspaceId =
    propWorkspaceId ?? (params.workspaceId as WorkspaceId | undefined)

  const [searchQuery, setSearchQuery] = React.useState('')
  const [debouncedQuery] = useDebouncedValue(searchQuery, { wait: 200 })
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [mode, setMode] = React.useState<SearchMode>('balanced')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const {
    data,
    isPending,
    isFetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    searchInfiniteQueryOptions(workspaceId as WorkspaceId, debouncedQuery, {
      limit: 15,
      mode,
      enabled: Boolean(workspaceId && debouncedQuery.trim().length > 0),
    }),
  )

  const items = React.useMemo<SearchResultItemType[]>(
    () => data?.pages.flatMap((page) => page.payload) ?? [],
    [data],
  )

  const handleSelectResult = React.useCallback(
    (item: SearchResultItemType) => {
      if (!workspaceId) return
      onClose()

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
    [workspaceId, navigate, onClose],
  )

  const isSheet = variant === 'sheet'

  const handleHoverResult = React.useCallback(
    (index: number) => {
      if (!isSheet) setSelectedIndex(index)
    },
    [isSheet],
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

  return (
    <div
      className={
        isSheet ? 'flex flex-col h-full overflow-hidden' : 'flex flex-col'
      }
      onKeyDown={handleKeyDown}
    >
      {isSheet && (
        <div className="mx-auto mt-2.5 mb-1 h-1 w-10 rounded-full bg-muted-foreground/30 shrink-0" />
      )}

      <div className="flex items-center border-b px-3.5 py-2.5 gap-2 bg-background shrink-0">
        <Search className="size-4 text-muted-foreground shrink-0" />
        <Input
          ref={inputRef}
          type="text"
          autoFocus
          placeholder={m.search_dialog_placeholder()}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setSelectedIndex(0)
          }}
          className="border-0 shadow-none focus-visible:ring-0 text-sm h-8 px-0 placeholder:text-muted-foreground/70"
        />
        {isFetching && (
          <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />
        )}
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setSelectedIndex(0)
              inputRef.current?.focus()
            }}
            className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 transition-colors"
            title={m.search_dialog_clear()}
          >
            <X className="size-3.5" />
          </button>
        )}
        {isSheet ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground shrink-0"
          >
            {m.search_dialog_close()}
          </Button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center rounded-xs border bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground select-none shrink-0">
            Esc
          </kbd>
        )}
      </div>

      <div className="shrink-0">
        <SearchModeSelector mode={mode} onSelectMode={setMode} />
      </div>

      <ScrollArea
        className={
          isSheet
            ? 'flex-1 min-h-0 p-2 overflow-y-auto'
            : 'max-h-[380px] p-2 min-h-[140px]'
        }
      >
        {debouncedQuery.trim() === '' ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            <Search className="size-8 mx-auto mb-2 opacity-30" />
            <p className="font-medium text-foreground/80">
              {m.search_dialog_empty_title()}
            </p>
            <p className="mt-1">{m.search_dialog_empty_desc()}</p>
          </div>
        ) : isPending && items.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            <Loader2 className="size-6 mx-auto mb-2 animate-spin text-primary" />
            {m.search_dialog_searching()}
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center text-xs text-muted-foreground">
            <p className="font-medium text-foreground/80">
              {m.search_dialog_no_results()}
            </p>
            <p className="mt-1">{m.search_dialog_no_results_desc()}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => (
              <SearchResultItem
                key={`${item.pageId}-${item.headingBlockId ?? index}`}
                item={item}
                index={index}
                isSelected={!isSheet && index === selectedIndex}
                query={debouncedQuery}
                onSelect={handleSelectResult}
                onHover={handleHoverResult}
              />
            ))}

            <InfiniteScroll
              hasNextPage={hasNextPage}
              fetchNextPage={() => fetchNextPage()}
              isFetchingNextPage={isFetchingNextPage}
              loadingText={m.search_dialog_searching()}
              loadMoreText={m.search_dialog_load_more()}
              showButtonFallback
            />
          </div>
        )}
      </ScrollArea>

      <div className="flex items-center justify-between border-t bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground shrink-0">
        {isSheet ? (
          <span className="text-[11px] text-muted-foreground">
            {items.length > 0
              ? m.search_dialog_results_count({
                  count: data?.pages[0]?.pagination.total ?? items.length,
                })
              : ''}
          </span>
        ) : (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded-xs border bg-background px-1 py-0.5 text-[10px] font-mono shadow-2xs">
                ↑
              </kbd>
              <kbd className="rounded-xs border bg-background px-1 py-0.5 text-[10px] font-mono shadow-2xs">
                ↓
              </kbd>
              <span>{m.search_dialog_navigate()}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-xs border bg-background px-1.5 py-0.5 text-[10px] font-mono shadow-2xs">
                ↵
              </kbd>
              <span>{m.search_dialog_open()}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-xs border bg-background px-1.5 py-0.5 text-[10px] font-mono shadow-2xs">
                Esc
              </kbd>
              <span>{m.search_dialog_close()}</span>
            </span>
          </div>
        )}
        <span className="font-medium text-[10px] ms-auto">
          {mode === 'balanced' && m.search_dialog_footer_balanced()}
          {mode === 'conceptual' && m.search_dialog_footer_conceptual()}
          {mode === 'exact' && m.search_dialog_footer_exact()}
        </span>
      </div>
    </div>
  )
}
