import { Sparkles, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { m } from '@/paraglide/messages'

export interface SuggestionItem {
  id: string
  label: string
  prompt: string
}

interface SuggestionsProps {
  suggestions?: SuggestionItem[]
  onSelectSuggestion: (prompt: string) => void
  className?: string
}

export function getDefaultWorkspaceSuggestions(): SuggestionItem[] {
  return [
    {
      id: 'sug_1',
      label: m.ai_suggestion_summarize_roadmap_label(),
      prompt: m.ai_suggestion_summarize_roadmap_prompt(),
    },
    {
      id: 'sug_2',
      label: m.ai_suggestion_explain_arch_label(),
      prompt: m.ai_suggestion_explain_arch_prompt(),
    },
    {
      id: 'sug_3',
      label: m.ai_suggestion_action_items_label(),
      prompt: m.ai_suggestion_action_items_prompt(),
    },
    {
      id: 'sug_4',
      label: m.ai_suggestion_schema_label(),
      prompt: m.ai_suggestion_schema_prompt(),
    },
  ]
}

export function Suggestions({
  suggestions,
  onSelectSuggestion,
  className,
}: SuggestionsProps) {
  const items = suggestions ?? getDefaultWorkspaceSuggestions()
  if (!items || items.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <Sparkles className="size-3 text-primary" />
        <span>{m.ai_suggestions_title()}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectSuggestion(item.prompt)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-background/80 hover:bg-accent/70 px-3 py-1 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground hover:shadow-2xs"
          >
            <span>{item.label}</span>
            <ArrowUpRight className="size-3 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
          </button>
        ))}
      </div>
    </div>
  )
}
