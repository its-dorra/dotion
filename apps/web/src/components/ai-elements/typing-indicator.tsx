import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
  statusText?: string
}

export function TypingIndicator({
  className,
  statusText = 'Dotion AI is thinking...',
}: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground w-fit shadow-2xs animate-in fade-in duration-300',
        className,
      )}
    >
      <Sparkles className="size-3.5 text-primary animate-pulse" />
      <span className="font-medium text-foreground/80">{statusText}</span>
      <div className="flex items-center gap-1 pl-1">
        <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
        <span className="size-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
        <span className="size-1.5 rounded-full bg-primary/60 animate-bounce" />
      </div>
    </div>
  )
}
