interface LastEditedIndicatorProps {
  lastEditedAt: string;
  lastEditedByName: string;
}

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function LastEditedIndicator({
  lastEditedAt,
  lastEditedByName,
}: LastEditedIndicatorProps) {
  return (
    <span className="hidden whitespace-nowrap text-xs text-muted-foreground sm:inline">
      Edited {formatRelativeTime(lastEditedAt)} by {lastEditedByName}
    </span>
  );
}
