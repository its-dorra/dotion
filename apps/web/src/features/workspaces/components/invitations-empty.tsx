import { Mail } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import * as m from '@/paraglide/messages'

export function InvitationsEmpty() {
  return (
    <Empty className="border-0 py-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Mail className="size-5 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle className="text-sm font-medium">
          {m.invitations_empty_title()}
        </EmptyTitle>
        <EmptyDescription className="max-w-xs text-sm">
          {m.invitations_empty_desc()}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
