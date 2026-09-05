import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface InfiniteScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  hasNextPage?: boolean
  fetchNextPage?: () => void
  isFetchingNextPage?: boolean
  loadingText?: string
  loadMoreText?: string
  showButtonFallback?: boolean
  rootMargin?: string
}

export function InfiniteScroll({
  children,
  hasNextPage = false,
  fetchNextPage,
  isFetchingNextPage = false,
  loadingText = 'Loading more…',
  loadMoreText = 'Load more',
  showButtonFallback = false,
  rootMargin = '100px',
  className,
  ...props
}: InfiniteScrollProps) {
  const sentinelRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !fetchNextPage) {
      return
    }

    const element = sentinelRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      {
        rootMargin,
        threshold: 0.1,
      },
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin])

  return (
    <div className={cn('w-full', className)} {...props}>
      {children}

      {hasNextPage && (
        <div
          ref={sentinelRef}
          className="flex w-full items-center justify-center p-3 text-xs text-muted-foreground"
          aria-live="polite"
        >
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span>{loadingText}</span>
            </div>
          ) : showButtonFallback ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage?.()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {loadMoreText}
            </Button>
          ) : (
            <div className="h-4" />
          )}
        </div>
      )}
    </div>
  )
}
