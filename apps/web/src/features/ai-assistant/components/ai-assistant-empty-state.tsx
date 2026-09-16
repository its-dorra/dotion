import { Bot } from 'lucide-react'
import { Suggestions } from '@/components/ai-elements'
import { m } from '@/paraglide/messages'

interface AiAssistantEmptyStateProps {
  onSelectSuggestion: (prompt: string) => void
}

export function AiAssistantEmptyState({
  onSelectSuggestion,
}: AiAssistantEmptyStateProps) {
  return (
    <div className="flex h-full flex-col justify-between py-6 px-2 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col items-center justify-center text-center pt-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-3 shadow-xs">
          <Bot className="size-6" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          {m.ai_assistant_empty_title()}
        </h3>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed">
          {m.ai_assistant_empty_desc()}
        </p>
      </div>

      <div className="pt-4">
        <Suggestions onSelectSuggestion={onSelectSuggestion} />
      </div>
    </div>
  )
}
