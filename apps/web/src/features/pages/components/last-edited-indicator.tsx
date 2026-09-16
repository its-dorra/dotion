import { m } from '@/paraglide/messages'

interface LastEditedIndicatorProps {
  lastEditedAt: Date
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - new Date(date).getTime()
  const diffMinutes = Math.round(diffMs / 60_000)

  if (diffMinutes < 1) return null
  if (diffMinutes < 60) return `${diffMinutes}m`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`

  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function LastEditedIndicator({
  lastEditedAt,
}: LastEditedIndicatorProps) {
  console.log({ lastEditedAt })
  const relativeTime = formatRelativeTime(lastEditedAt)

  return (
    <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">
      {relativeTime
        ? m.page_last_edited({ time: relativeTime })
        : m.page_last_edited_just_now()}
    </span>
  )
}
