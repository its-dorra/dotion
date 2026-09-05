import { Sparkles, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export const DEFAULT_WORKSPACE_SUGGESTIONS: SuggestionItem[] = [
  {
    id: 'sug_1',
    label: 'Summarize roadmap',
    prompt:
      'Summarize the roadmap and current project goals from our workspace documents.',
  },
  {
    id: 'sug_2',
    label: 'Explain architecture',
    prompt:
      'Give me an overview of the system architecture described in our docs.',
  },
  {
    id: 'sug_3',
    label: 'Find meeting action items',
    prompt:
      'What are the most recent open action items from our meeting notes?',
  },
  {
    id: 'sug_4',
    label: 'Search database schema',
    prompt:
      'Explain the database tables and entity relationships documented in our workspace.',
  },
]

export function Suggestions({
  suggestions = DEFAULT_WORKSPACE_SUGGESTIONS,
  onSelectSuggestion,
  className,
}: SuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <Sparkles className="size-3 text-primary" />
        <span>Suggested Questions</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((item) => (
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
