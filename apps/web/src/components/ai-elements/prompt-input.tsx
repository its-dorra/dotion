import * as React from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  onStop?: () => void
  isStreaming?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming = false,
  disabled = false,
  placeholder = 'Ask anything about your workspace documents...',
  className,
}: PromptInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming && value.trim() && !disabled) {
        onSubmit(value)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isStreaming) {
      onStop?.()
    } else if (value.trim() && !disabled) {
      onSubmit(value)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative flex flex-col rounded-xl border bg-background p-2 shadow-xs transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20',
        disabled && 'opacity-60 pointer-events-none',
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || (isStreaming && false)}
        className="w-full resize-none border-0 bg-transparent px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 min-h-[36px] max-h-[160px] leading-relaxed"
      />

      <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-muted-foreground">
        <span className="text-[10px] opacity-70">
          Press <kbd className="font-mono text-[9px]">Enter ↵</kbd> to send,{' '}
          <kbd className="font-mono text-[9px]">Shift+Enter</kbd> for newline
        </span>

        {isStreaming ? (
          <Button
            type="button"
            size="icon"
            onClick={onStop}
            className="size-7 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-2xs transition-transform active:scale-95"
            title="Stop generation"
          >
            <Square className="size-3 fill-current" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!value.trim() || disabled}
            className="size-7 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs transition-transform active:scale-95 disabled:opacity-40"
            title="Send prompt"
          >
            <ArrowUp className="size-3.5 stroke-[2.5]" />
          </Button>
        )}
      </div>
    </form>
  )
}
