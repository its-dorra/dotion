import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, RefreshCw, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'

export interface AppLayoutErrorProps extends Partial<ErrorComponentProps> {
  message?: string
  onRetry?: () => void
}

export function AppLayoutError({
  error,
  reset,
  message,
  onRetry,
}: AppLayoutErrorProps) {
  const handleRetry = () => {
    if (reset) reset()
    else if (onRetry) onRetry()
    else window.location.reload()
  }

  const errorMessage =
    message ||
    (error instanceof Error ? error.message : m.error_generic_description())

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
        <AlertTriangle className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
        {m.error_generic_title()}
      </h2>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {errorMessage}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
