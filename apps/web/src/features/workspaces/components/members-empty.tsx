import { UserPlus } from 'lucide-react'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import * as m from '@/paraglide/messages'

export function MembersEmpty() {
  return (
    <Empty className="border-0 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <UserPlus className="size-5 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle className="text-sm font-medium">
          {m.members_empty_title()}
        </EmptyTitle>
        <EmptyDescription className="max-w-xs text-sm">
          {m.members_empty_desc()}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
