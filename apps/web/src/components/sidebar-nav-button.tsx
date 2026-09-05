import type { LucideIcon } from 'lucide-react'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface SidebarNavButtonProps {
  icon: LucideIcon
  label: string
  isActive: boolean
  onClick: () => void
  badge?: boolean
}

export function SidebarNavButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  badge,
}: SidebarNavButtonProps) {
  return (
    <SidebarMenuButton
      tooltip={label}
      onClick={onClick}
      isActive={isActive}
      aria-pressed={isActive}
      aria-label={label}
      className={cn(
        'relative justify-start',
        !isActive && 'w-8 justify-center px-0',
      )}
    >
      <span className="relative flex items-center justify-center">
        <Icon />
        {badge ? (
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
        ) : null}
      </span>
      {isActive ? <span>{label}</span> : null}
    </SidebarMenuButton>
  )
}
