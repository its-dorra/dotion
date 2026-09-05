import * as React from 'react'
import { Sparkles, User, Copy, Check } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CodeBlock } from './code-block'
import { Sources } from './sources'
import type { AssistantCitation } from '@dotion/shared/assistant/types'
import { cn } from '@/lib/utils'

export interface MessageProps {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: AssistantCitation[]
  createdAt?: string | Date
  tokensUsed?: number
  isStreaming?: boolean
  onSelectCitation?: (citation: AssistantCitation) => void
  className?: string
}

function parseMarkdownContent(
  text: string,
  citations?: AssistantCitation[],
  onSelectCitation?: (citation: AssistantCitation) => void,
) {
  // Split into code block chunks vs text chunks
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g
  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textChunk = text.slice(lastIndex, match.index)
      elements.push(
        <div key={`text-${lastIndex}`} className="space-y-2">
          {renderTextParagraphs(textChunk, citations, onSelectCitation)}
        </div>,
      )
    }

    const language = match[1] ?? ''
    const code = match[2] ?? ''
    elements.push(
      <CodeBlock
        key={`code-${match.index}`}
        language={language}
        value={code.trimEnd()}
      />,
    )

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    const textChunk = text.slice(lastIndex)
    elements.push(
      <div key={`text-${lastIndex}`} className="space-y-2">
        {renderTextParagraphs(textChunk, citations, onSelectCitation)}
      </div>,
    )
  }

  return elements
}

function renderTextParagraphs(
  chunk: string,
  citations?: AssistantCitation[],
  onSelectCitation?: (citation: AssistantCitation) => void,
) {
  const lines = chunk.split('\n\n')

  return lines.map((para, pIdx) => {
    const trimmed = para.trim()
    if (!trimmed) return null

    // Headings
    if (trimmed.startsWith('### ')) {
      return (
        <h4
          key={pIdx}
          className="text-xs font-semibold text-foreground mt-2 mb-1"
        >
          {renderFormattedInline(trimmed.slice(4), citations, onSelectCitation)}
        </h4>
      )
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3
          key={pIdx}
          className="text-sm font-semibold text-foreground mt-2.5 mb-1 border-b pb-0.5"
        >
          {renderFormattedInline(trimmed.slice(3), citations, onSelectCitation)}
        </h3>
      )
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2
          key={pIdx}
          className="text-base font-bold text-foreground mt-3 mb-1"
        >
          {renderFormattedInline(trimmed.slice(2), citations, onSelectCitation)}
        </h2>
      )
    }

    // Bullet lists
    if (
      trimmed.startsWith('- ') ||
      trimmed.startsWith('* ') ||
      trimmed.startsWith('• ')
    ) {
      const items = trimmed.split(/\n(?=[-•*]\s)/)
      return (
        <ul
          key={pIdx}
          className="list-disc list-inside space-y-1 my-1 pl-1 text-xs"
        >
          {items.map((item, iIdx) => (
            <li key={iIdx} className="leading-relaxed">
              {renderFormattedInline(
                item.replace(/^[-•*]\s+/, ''),
                citations,
                onSelectCitation,
              )}
            </li>
          ))}
        </ul>
      )
    }

    // Numbered lists
    if (/^\d+\.\s/.test(trimmed)) {
      const items = trimmed.split(/\n(?=\d+\.\s)/)
      return (
        <ol
          key={pIdx}
          className="list-decimal list-inside space-y-1 my-1 pl-1 text-xs"
        >
          {items.map((item, iIdx) => (
            <li key={iIdx} className="leading-relaxed">
              {renderFormattedInline(
                item.replace(/^\d+\.\s+/, ''),
                citations,
                onSelectCitation,
              )}
            </li>
          ))}
        </ol>
      )
    }

    return (
      <p key={pIdx} className="leading-relaxed text-xs">
        {renderFormattedInline(trimmed, citations, onSelectCitation)}
      </p>
    )
  })
}

function renderFormattedInline(
  text: string,
  citations?: AssistantCitation[],
  onSelectCitation?: (citation: AssistantCitation) => void,
): React.ReactNode {
  // Match inline code `code`, bold **bold**, and citations [1], [2]
  const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|\[\d+\])/g
  const parts = text.split(inlineRegex)

  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded-xs bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground font-medium"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    const citationMatch = part.match(/^\[(\d+)\]$/)
    if (citationMatch) {
      const sourceNum = parseInt(citationMatch[1]!, 10)
      const citation = citations?.[sourceNum - 1]

      return (
        <button
          key={i}
          type="button"
          onClick={() => citation && onSelectCitation?.(citation)}
          className={cn(
            'inline-flex items-center justify-center rounded-xs bg-primary/15 hover:bg-primary hover:text-primary-foreground text-primary font-mono text-[10px] font-bold px-1 py-0 mx-0.5 transition-colors cursor-pointer align-baseline',
            !citation && 'opacity-60 cursor-default',
          )}
          title={
            citation
              ? `Source ${sourceNum}: ${citation.pageTitle}${citation.sectionTitle ? ` > ${citation.sectionTitle}` : ''}`
              : `Source [${sourceNum}]`
          }
        >
          {sourceNum}
        </button>
      )
    }

    return part
  })
}

export function Message({
  role,
  content,
  citations,
  tokensUsed,
  isStreaming,
  onSelectCitation,
  className,
}: MessageProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  const handleCopy = async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch {
      // Non-fatal
    }
  }

  if (role === 'user') {
    return (
      <div
        className={cn(
          'flex items-start justify-end gap-2.5 my-3 pl-8 animate-in fade-in slide-in-from-bottom-1 duration-200',
          className,
        )}
      >
        <div className="rounded-2xl rounded-tr-xs bg-primary text-primary-foreground px-3.5 py-2.5 text-xs shadow-2xs max-w-[85%] leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
        <Avatar className="size-6.5 shrink-0 border mt-0.5">
          <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-semibold">
            <User className="size-3.5" />
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-2.5 my-3 pr-4 animate-in fade-in slide-in-from-bottom-1 duration-200',
        className,
      )}
    >
      <Avatar className="size-6.5 shrink-0 border border-primary/20 bg-primary/10 mt-0.5">
        <AvatarFallback className="bg-transparent text-primary">
          <Sparkles className="size-3.5 text-primary" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-semibold text-xs text-foreground">
            Dotion AI
          </span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {tokensUsed !== undefined && tokensUsed > 0 && (
              <span className="font-mono text-[9px] text-muted-foreground/70">
                {tokensUsed} tokens
              </span>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Copy answer"
            >
              {hasCopied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
        </div>

        <div className="text-foreground/90 space-y-2 text-xs leading-relaxed">
          {parseMarkdownContent(content, citations, onSelectCitation)}
          {isStreaming && (
            <span className="inline-block h-3.5 w-1.5 bg-primary animate-pulse ml-0.5 align-middle rounded-xs" />
          )}
        </div>

        {citations && citations.length > 0 && (
          <Sources citations={citations} onSelectCitation={onSelectCitation} />
        )}
      </div>
    </div>
  )
}
