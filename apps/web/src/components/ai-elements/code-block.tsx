import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'

interface CodeBlockProps {
  language?: string
  value: string
  className?: string
}

export function CodeBlock({ language, value, className }: CodeBlockProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch {
      // Non-fatal
    }
  }

  return (
    <div
      className={cn(
        'relative my-3 overflow-hidden rounded-lg border bg-zinc-950 dark:bg-zinc-900 text-zinc-100 font-mono text-xs',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 dark:bg-zinc-950/80 px-3.5 py-1.5 text-[11px] text-zinc-400">
        <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-300">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          title={m.ai_code_copy()}
        >
          {hasCopied ? (
            <>
              <Check className="size-3 text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-medium">
                {m.ai_code_copied()}
              </span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span className="text-[10px]">{m.ai_code_copy()}</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 leading-relaxed">
        <code>{value}</code>
      </pre>
    </div>
  )
}
