import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { CollaborativeUser } from '../hooks/use-page-awareness'

interface CollaboratorsListProps {
  users?: CollaborativeUser[]
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]
  const last = parts[parts.length - 1]
  if (parts.length >= 2 && first && last && first[0] && last[0]) {
    return (first[0] + last[0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function CollaboratorsList({ users = [] }: CollaboratorsListProps) {
  if (users.length === 0) {
    return null
  }

  const maxVisible = 3
  const visibleUsers = users.slice(0, maxVisible)
  const overflowCount = users.length - maxVisible

  return (
    <TooltipProvider>
      <AvatarGroup>
        {visibleUsers.map((user) => (
          <Tooltip key={user.clientId}>
            <TooltipTrigger asChild>
              <Avatar size="sm">
                <AvatarFallback
                  style={{ backgroundColor: user.color }}
                  className="text-[10px] font-semibold text-white"
                >
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {user.name}
            </TooltipContent>
          </Tooltip>
        ))}

        {overflowCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AvatarGroupCount className="text-xs font-medium">
                +{overflowCount}
              </AvatarGroupCount>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {users
                .slice(maxVisible)
                .map((u) => u.name)
                .join(', ')}
            </TooltipContent>
          </Tooltip>
        )}
      </AvatarGroup>
    </TooltipProvider>
  )
}
