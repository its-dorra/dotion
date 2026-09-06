import { FileText, Hash, ExternalLink } from 'lucide-react'
import type { AssistantCitation } from '@dotion/shared/assistant/types'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'

interface SourcesProps {
  citations: AssistantCitation[]
  onSelectCitation?: (citation: AssistantCitation) => void
  className?: string
}

export function Sources({
  citations,
  onSelectCitation,
  className,
}: SourcesProps) {
  if (!citations || citations.length === 0) return null

  return (
    <div className={cn('mt-3 flex flex-col gap-1.5', className)}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <FileText className="size-3 text-primary/80" />
        <span>{m.ai_sources_title({ count: citations.length })}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {citations.map((citation, index) => {
          const sourceNum = index + 1
          return (
            <button
              key={`${citation.pageId}-${citation.headingBlockId ?? index}`}
              type="button"
              onClick={() => onSelectCitation?.(citation)}
              className="group flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/60 hover:bg-accent/60 p-2 text-left transition-all hover:border-primary/30 hover:shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex size-4.5 shrink-0 items-center justify-center rounded-xs bg-muted font-mono text-[10px] font-bold text-foreground/80 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {sourceNum}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">
                    {citation.pageTitle}
                  </p>
                  {citation.sectionTitle &&
                    citation.sectionTitle !== citation.pageTitle && (
                      <p className="flex items-center gap-0.5 truncate text-[10px] text-muted-foreground">
                        <Hash className="size-2.5 shrink-0" />
                        {citation.sectionTitle}
                      </p>
                    )}
                </div>
              </div>

              <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
