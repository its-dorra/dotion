import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, RefreshCw, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'

export interface TrashErrorProps extends Partial<ErrorComponentProps> {
  message?: string
  onRetry?: () => void
  workspaceId?: string
}

export function TrashError({
  error,
  reset,
  message,
  onRetry,
}: TrashErrorProps) {
  const handleRetry = () => {
    if (reset) reset()
    else if (onRetry) onRetry()
    else window.location.reload()
  }

  const errorMessage =
    message ||
    (error instanceof Error ? error.message : m.error_trash_load_failed())

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
        {m.error_trash_load_failed()}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">{errorMessage}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={handleRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          {m.error_action_retry()}
        </Button>
        <Button asChild variant="outline">
          <Link to="/app/workspaces">
            <LayoutGrid className="mr-2 h-4 w-4" />
            {m.error_action_view_workspaces()}
          </Link>
        </Button>
      </div>
    </div>
  )
}
