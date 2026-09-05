import * as React from 'react'
import { ArrowDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConversationProps {
  children: React.ReactNode
  onLoadEarlier?: () => void
  hasEarlier?: boolean
  isLoadingEarlier?: boolean
  className?: string
}

export function Conversation({
  children,
  onLoadEarlier,
  hasEarlier = false,
  isLoadingEarlier = false,
  className,
}: ConversationProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const [showScrollBottom, setShowScrollBottom] = React.useState(false)
  const isAutoScrollEnabled = React.useRef(true)

  // Scroll tracking
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100

    isAutoScrollEnabled.current = isNearBottom
    setShowScrollBottom(!isNearBottom)

    // Check top trigger for infinite scroll
    if (el.scrollTop < 40 && hasEarlier && !isLoadingEarlier && onLoadEarlier) {
      onLoadEarlier()
    }
  }

  // Auto-scroll to bottom when children update if pinned
  React.useEffect(() => {
    if (isAutoScrollEnabled.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [children])

  const scrollToBottom = () => {
    isAutoScrollEnabled.current = true
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollBottom(false)
  }

  return (
    <div
      className={cn('relative flex flex-1 flex-col overflow-hidden', className)}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 min-h-0"
      >
        {/* Top Infinite Loading Indicator */}
        {hasEarlier && (
          <div className="flex justify-center py-2 text-xs text-muted-foreground">
            {isLoadingEarlier ? (
              <div className="flex items-center gap-1.5">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>Loading earlier messages...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={onLoadEarlier}
                className="rounded-md border bg-background/80 hover:bg-accent px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Load earlier messages
              </button>
            )}
          </div>
        )}

        {children}

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Floating Scroll-to-Bottom Pill */}
      {showScrollBottom && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={scrollToBottom}
          className="absolute bottom-3 right-4 shadow-md rounded-full text-xs gap-1.5 h-7 px-3 bg-background/90 backdrop-blur-xs border-primary/30 text-foreground hover:bg-accent animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <ArrowDown className="size-3 text-primary" />
          <span>Latest messages</span>
        </Button>
      )}
    </div>
  )
}
