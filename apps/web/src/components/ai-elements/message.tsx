import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkBreaks from 'remark-breaks'
import remarkEmoji from 'remark-emoji'
import rehypeKatex from 'rehype-katex'
import rehypeSlug from 'rehype-slug'
import rehypeExternalLinks from 'rehype-external-links'
import { Sparkles, Copy, Check } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CodeBlock } from './code-block'
import { Sources } from './sources'
import { ToolCall } from './tool-call'
import { m } from '@/paraglide/messages'
import type { AssistantCitation } from '@dotion/shared/assistant/types'
import type { ToolPart } from '@/features/ai-assistant/types'
import { cn } from '@/lib/utils'

export interface MessageProps {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: AssistantCitation[]
  toolParts?: ToolPart[]
  createdAt?: string | Date
  tokensUsed?: number
  isStreaming?: boolean
  onSelectCitation?: (citation: AssistantCitation) => void
  className?: string
}

const REMARK_PLUGINS = [remarkGfm, remarkMath, remarkBreaks, remarkEmoji]
const REHYPE_PLUGINS = [
  rehypeKatex,
  rehypeSlug,
  [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
] as React.ComponentProps<typeof ReactMarkdown>['rehypePlugins']

export const Message = React.memo(function Message({
  role,
  content,
  citations,
  toolParts,
  tokensUsed,
  isStreaming,
  onSelectCitation,
  className,
}: MessageProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  const handleCopy = React.useCallback(() => {
    if (!content) return
    navigator.clipboard.writeText(content)
    setHasCopied(true)
    setTimeout(() => setHasCopied(false), 2000)
  }, [content])

  const processedContent = React.useMemo(() => {
    return content.replace(/(?<=\s|^|[(])\[(\d+)\]/g, '[$1](#citation-$1)')
  }, [content])

  const isUser = role === 'user'

  if (isUser) {
    return (
      <div
        className={cn(
          'flex items-start justify-end gap-3 group max-w-[88%] ml-auto',
          className,
        )}
      >
        <div className="bg-primary text-primary-foreground px-3.5 py-2.5 rounded-lg text-xs leading-relaxed break-words whitespace-pre-wrap selection:bg-primary-foreground/20 selection:text-primary-foreground">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex items-start gap-3 group max-w-[95%]', className)}>
      <Avatar className="size-7 shrink-0 bg-primary/10 border border-primary/20">
        <AvatarFallback className="text-primary text-[10px] font-bold">
          <Sparkles className="size-3.5" />
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-semibold text-xs text-foreground">
            {m.ai_message_dotion_ai()}
          </span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {tokensUsed !== undefined && tokensUsed > 0 && (
              <span className="font-mono text-[9px] text-muted-foreground/70">
                {m.ai_message_tokens({ count: tokensUsed })}
              </span>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={m.ai_message_copy()}
            >
              {hasCopied ? (
                <Check className="size-3 text-emerald-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </button>
          </div>
        </div>

        {toolParts && toolParts.length > 0 && (
          <div className="space-y-1 mb-2">
            {toolParts.map((part) => (
              <ToolCall key={part.toolCallId} part={part} />
            ))}
          </div>
        )}

        <div className="text-foreground/90 space-y-2 text-xs leading-relaxed">
          {content ? (
            <ReactMarkdown
              remarkPlugins={REMARK_PLUGINS}
              rehypePlugins={REHYPE_PLUGINS}
              components={{
                code({ className: codeClassName, children, ...props }) {
                  const match = /language-(\w+)/.exec(codeClassName || '')
                  const codeString = String(children).replace(/\n$/, '')
                  const isInline = !match && !String(children).includes('\n')

                  if (isInline) {
                    return (
                      <code
                        className="rounded-xs bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground font-medium"
                        {...props}
                      >
                        {children}
                      </code>
                    )
                  }

                  return (
                    <CodeBlock
                      language={match ? match[1] : ''}
                      value={codeString}
                    />
                  )
                },
                a({ href, children, ...props }) {
                  const citationMatch = href?.match(/^#citation-(\d+)$/)
                  if (citationMatch) {
                    const sourceNum = parseInt(citationMatch[1]!, 10)
                    const citation = citations?.[sourceNum - 1]

                    return (
                      <button
                        key={`citation-${sourceNum}`}
                        type="button"
                        onClick={() => citation && onSelectCitation?.(citation)}
                        className={cn(
                          'inline-flex items-center justify-center rounded-xs bg-primary/15 hover:bg-primary hover:text-primary-foreground text-primary font-mono text-[10px] font-bold px-1 py-0 mx-0.5 transition-colors cursor-pointer align-baseline',
                          !citation && 'opacity-60 cursor-default',
                        )}
                        title={
                          citation
                            ? m.ai_message_source_tooltip({
                                number: sourceNum,
                                title: `${citation.pageTitle}${citation.sectionTitle ? ` > ${citation.sectionTitle}` : ''}`,
                              })
                            : m.ai_message_source_fallback({
                                number: sourceNum,
                              })
                        }
                      >
                        {sourceNum}
                      </button>
                    )
                  }

                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                      {...props}
                    >
                      {children}
                    </a>
                  )
                },
                h1({ children }) {
                  return (
                    <h2 className="text-base font-bold text-foreground mt-3 mb-1.5">
                      {children}
                    </h2>
                  )
                },
                h2({ children }) {
                  return (
                    <h3 className="text-sm font-semibold text-foreground mt-2.5 mb-1 border-b pb-0.5">
                      {children}
                    </h3>
                  )
                },
                h3({ children }) {
                  return (
                    <h4 className="text-xs font-semibold text-foreground mt-2 mb-1">
                      {children}
                    </h4>
                  )
                },
                p({ children }) {
                  return (
                    <p className="leading-relaxed text-xs my-1.5">{children}</p>
                  )
                },
                ul({ children }) {
                  return (
                    <ul className="list-disc list-inside space-y-1 my-1 pl-1 text-xs">
                      {children}
                    </ul>
                  )
                },
                ol({ children }) {
                  return (
                    <ol className="list-decimal list-inside space-y-1 my-1 pl-1 text-xs">
                      {children}
                    </ol>
                  )
                },
                li({ children }) {
                  return <li className="leading-relaxed">{children}</li>
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-s-2 border-primary/40 ps-3 my-2 text-xs italic text-muted-foreground">
                      {children}
                    </blockquote>
                  )
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto my-2">
                      <table className="w-full text-xs border-collapse border border-border">
                        {children}
                      </table>
                    </div>
                  )
                },
                thead({ children }) {
                  return (
                    <thead className="bg-muted/60 text-foreground font-semibold">
                      {children}
                    </thead>
                  )
                },
                th({ children }) {
                  return (
                    <th className="border border-border px-2.5 py-1 text-left font-semibold">
                      {children}
                    </th>
                  )
                },
                td({ children }) {
                  return (
                    <td className="border border-border px-2.5 py-1">
                      {children}
                    </td>
                  )
                },
                hr() {
                  return <hr className="my-2.5 border-border" />
                },
                strong({ children }) {
                  return (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  )
                },
              }}
            >
              {processedContent}
            </ReactMarkdown>
          ) : null}
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
})
