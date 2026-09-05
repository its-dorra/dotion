import { Inbox } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import * as m from '@/paraglide/messages'

export function NotificationsEmpty() {
  return (
    <Empty className="border-0 p-8">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox className="size-6 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle className="text-sm font-medium">
          {m.notifications_empty_title()}
        </EmptyTitle>
        <EmptyDescription className="max-w-[220px] text-sm">
          {m.notifications_empty_desc()}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
