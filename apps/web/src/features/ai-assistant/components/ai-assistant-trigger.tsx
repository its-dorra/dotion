import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as m from '@/paraglide/messages'

interface AiAssistantTriggerProps {
  onClick: () => void
}

export function AiAssistantTrigger({ onClick }: AiAssistantTriggerProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-6 inset-e-6 z-40 h-12 w-12 rounded-full shadow-lg"
      aria-label={m.ai_assistant_ask()}
    >
      <Sparkles className="h-5 w-5" />
    </Button>
  )
}
