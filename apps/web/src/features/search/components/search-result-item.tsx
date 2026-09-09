import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CornerDownLeft, FileText, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchResultItem as SearchResultItemType } from '../types'

interface SearchResultItemProps {
  item: SearchResultItemType
  index: number
  isSelected: boolean
  query: string
  onSelect: (item: SearchResultItemType) => void
  onHover?: (index: number) => void
}

function highlightMatch(text: string, query: string): React.ReactNode {
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

function highlightInNode(
  node: React.ReactNode,
  query: string,
): React.ReactNode {
  if (typeof node === 'string') {
    return highlightMatch(node, query)
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>{highlightInNode(child, query)}</React.Fragment>
    ))
  }
  return node
}

function cleanPreviewMarkdown(content: string): string {
  return content
    .replace(/^\[Context:[\\s\\S]*?\]\n---\n/g, '')
    .replace(/^#{1,6}\\s+/gm, '')
    .trim()
}

const REMARK_PLUGINS = [remarkGfm]

export const SearchResultItem = React.memo(function SearchResultItem({
  item,
  index,
  isSelected,
  query,
  onSelect,
  onHover,
}: SearchResultItemProps) {
  const cleanContent = React.useMemo(
    () => cleanPreviewMarkdown(item.content),
    [item.content],
  )
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(item)}
      onMouseEnter={() => onHover?.(index)}
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
          {item.sectionTitle && item.sectionTitle !== item.pageTitle && (
            <>
              <span className="text-muted-foreground/60 text-[10px]">&gt;</span>
              <span className="flex items-center gap-0.5 text-muted-foreground truncate">
                <Hash className="size-3 shrink-0" />
                {item.sectionTitle}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isSelected && (
            <CornerDownLeft className="size-3 text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="line-clamp-2 text-[11px] text-muted-foreground/90 font-normal leading-relaxed pl-5 [&_p]:inline [&_h1]:inline [&_h2]:inline [&_h3]:inline [&_ul]:inline [&_ol]:inline [&_li]:inline">
        <ReactMarkdown
          remarkPlugins={REMARK_PLUGINS}
          components={{
            p({ children }) {
              return (
                <span className="inline mr-1">
                  {highlightInNode(children, query)}
                </span>
              )
            },
            strong({ children }) {
              return (
                <strong className="inline font-semibold text-foreground">
                  {highlightInNode(children, query)}
                </strong>
              )
            },
            em({ children }) {
              return (
                <em className="inline italic">
                  {highlightInNode(children, query)}
                </em>
              )
            },
            code({ children }) {
              return (
                <code className="inline rounded bg-muted/80 px-1 py-0.5 font-mono text-[10px] text-foreground font-medium">
                  {highlightInNode(children, query)}
                </code>
              )
            },
            li({ children }) {
              return (
                <span className="inline mr-1">
                  • {highlightInNode(children, query)}
                </span>
              )
            },
            ul({ children }) {
              return <span className="inline">{children}</span>
            },
            ol({ children }) {
              return <span className="inline">{children}</span>
            },
            blockquote({ children }) {
              return (
                <span className="inline italic text-muted-foreground mr-1">
                  {highlightInNode(children, query)}
                </span>
              )
            },
            a({ children }) {
              return (
                <span className="inline underline text-primary">
                  {highlightInNode(children, query)}
                </span>
              )
            },
          }}
        >
          {cleanContent}
        </ReactMarkdown>
      </div>
    </div>
  )
})
