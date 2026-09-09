import * as React from 'react'
import {
  Search,
  FileText,
  FolderTree,
  Split,
  Layers,
  Wrench,
  Loader2,
  Check,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import * as m from '@/paraglide/messages'
import type { ToolPart } from '@/features/ai-assistant/types'

export interface ToolCallProps {
  part: ToolPart
  className?: string
}

function getToolMeta(part: ToolPart, isDone: boolean) {
  switch (part.type) {
    case 'tool-searchWorkspace':
      return {
        icon: Search,
        label: isDone
          ? m.ai_tool_search_workspace_done()
          : m.ai_tool_search_workspace_running(),
        badge: part.input?.query,
      }
    case 'tool-readFullPage':
      return {
        icon: FileText,
        label: isDone
          ? m.ai_tool_read_full_page_done()
          : m.ai_tool_read_full_page_running(),
        badge:
          part.state === 'output-available' && part.output.pageTitle
            ? part.output.pageTitle
            : undefined,
      }
    case 'tool-getPageTree':
      return {
        icon: FolderTree,
        label: isDone
          ? m.ai_tool_get_page_tree_done()
          : m.ai_tool_get_page_tree_running(),
        badge:
          part.state === 'output-available'
            ? m.ai_tool_badge_pages({ count: part.output.items.length })
            : undefined,
      }
    case 'tool-fetchAdjacentSections':
      return {
        icon: Split,
        label: isDone
          ? m.ai_tool_fetch_adjacent_sections_done()
          : m.ai_tool_fetch_adjacent_sections_running(),
        badge:
          part.input?.sectionIndex !== undefined
            ? m.ai_tool_badge_section({ index: part.input.sectionIndex })
            : undefined,
      }
    case 'tool-getPageBlocks':
      return {
        icon: Layers,
        label: isDone
          ? m.ai_tool_get_page_blocks_done()
          : m.ai_tool_get_page_blocks_running(),
        badge:
          part.state === 'output-available'
            ? m.ai_tool_badge_blocks({ count: part.output.blocks.length })
            : undefined,
      }
    default:
      return {
        icon: Wrench,
        label: isDone
          ? m.ai_tool_fallback_done()
          : m.ai_tool_fallback_running(),
        badge: undefined,
      }
  }
}

export function ToolCall({ part, className }: ToolCallProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)
  const isDone =
    part.state === 'output-available' ||
    part.state === 'output-error' ||
    part.state === 'output-denied'
  const isError = part.state === 'output-error'
  const meta = getToolMeta(part, isDone)
  const Icon = meta.icon

  return (
    <div
      className={cn(
        'my-1.5 rounded-md border border-border/60 bg-muted/20 text-xs overflow-hidden transition-all duration-150',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-muted/40 cursor-pointer"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
            <Icon className="size-3" />
          </div>

          <span className="font-medium text-[11px] text-foreground/90 truncate">
            {meta.label}
          </span>

          {meta.badge && (
            <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground/80 truncate max-w-45 bg-muted/60 px-1 py-0.5 rounded">
              "{meta.badge}"
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isError ? (
            <span
              className="flex items-center text-destructive"
              title={m.ai_tool_title_error()}
            >
              <AlertCircle className="size-3.5" />
            </span>
          ) : isDone ? (
            <span
              className="flex items-center text-emerald-500"
              title={m.ai_tool_title_completed()}
            >
              <Check className="size-3.5 stroke-[2.5]" />
            </span>
          ) : (
            <span
              className="flex items-center text-primary"
              title={m.ai_tool_title_in_progress()}
            >
              <Loader2 className="size-3.5 animate-spin" />
            </span>
          )}

          <span className="text-muted-foreground/60">
            {isExpanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5" />
            )}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border/40 bg-muted/30 px-3 py-2 space-y-2 text-[11px] font-mono animate-in fade-in-50 duration-150">
          <div>
            <div className="text-[10px] font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              {m.ai_tool_parameters()}
            </div>
            <pre className="p-1.5 rounded bg-background/80 border border-border/40 overflow-x-auto text-foreground/80 text-[10px] leading-relaxed">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          </div>

          {part.state === 'output-available' && (
            <div>
              <div className="text-[10px] font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                {m.ai_tool_result()}
              </div>
              <pre className="p-1.5 rounded bg-background/80 border border-border/40 overflow-x-auto text-foreground/80 text-[10px] leading-relaxed max-h-48">
                {JSON.stringify(part.output, null, 2)}
              </pre>
            </div>
          )}

          {part.state === 'output-error' && (
            <div>
              <div className="text-[10px] font-sans font-semibold text-destructive uppercase tracking-wider mb-1">
                {m.ai_tool_title_error()}
              </div>
              <p className="text-destructive text-[10px] font-sans">
                {part.errorText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
