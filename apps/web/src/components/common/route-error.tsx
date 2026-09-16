import * as React from 'react'
import { Link, type ErrorComponentProps } from '@tanstack/react-router'
import {
  AlertTriangle,
  FileX,
  Lock,
  RefreshCw,
  Home,
  ChevronDown,
  ChevronUp,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'
import {
  PageNotFoundError,
  PageAlreadyInTrashError,
  InsufficientPagePermissionError,
} from '@/features/pages/errors'
import {
  WorkspaceNotFoundError,
  InsufficientWorkspacePermissionError,
} from '@/features/workspaces/errors'
import {
  AuthorizationError,
  InsufficientPermissionError,
} from '@/features/authorization/errors'
import { AuthenticationError, NotFoundError } from '@/lib/errors'

export interface RouteErrorFallbackProps extends Omit<
  Partial<ErrorComponentProps>,
  'error'
> {
  error?: Error | unknown
  reset?: () => void
  workspaceId?: string
  pageId?: string
}

export function RouteErrorFallback({
  error,
  reset,
  workspaceId,
}: RouteErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  const isPageNotFound = PageNotFoundError.is(error)
  const isWorkspaceNotFound = WorkspaceNotFoundError.is(error)
  const isGenericNotFound =
    NotFoundError.is(error) ||
    (error instanceof Error &&
      error.message.toLowerCase().includes('not found'))

  const isPageInTrash = PageAlreadyInTrashError.is(error)

  const isAccessDenied =
    InsufficientPagePermissionError.is(error) ||
    InsufficientWorkspacePermissionError.is(error) ||
    AuthorizationError.is(error) ||
    InsufficientPermissionError.is(error)

  const isAuthError = AuthenticationError.is(error)

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : null

  const errorStack = error instanceof Error ? error.stack : null

  let title = m.error_generic_title()
  let description = m.error_generic_description()
  let icon = <AlertTriangle className="size-8 text-destructive" />

  if (isPageNotFound) {
    title = m.page_not_found_title()
    description = m.page_not_found_description()
    icon = <FileX className="size-8 text-muted-foreground" />
  } else if (isWorkspaceNotFound) {
    title = m.workspace_not_found_title()
    description = m.workspace_not_found_description()
    icon = <AlertTriangle className="size-8 text-amber-500" />
  } else if (isGenericNotFound) {
    title = m.not_found_generic_title()
    description = m.not_found_generic_description()
    icon = <FileX className="size-8 text-muted-foreground" />
  } else if (isPageInTrash) {
    title = m.error_page_in_trash_title()
    description = m.error_page_in_trash_description()
    icon = <Trash2 className="size-8 text-amber-500" />
  } else if (isAccessDenied || isAuthError) {
    title = m.error_access_denied_title()
    description = m.error_access_denied_description()
    icon = <Lock className="size-8 text-amber-500" />
  }

  return (
    <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/60 ring-1 ring-border">
          {icon}
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {reset &&
            !isPageNotFound &&
            !isWorkspaceNotFound &&
            !isPageInTrash && (
              <Button
                variant="default"
                size="sm"
                onClick={reset}
                className="gap-1.5"
              >
                <RefreshCw className="size-3.5" />
                {m.error_action_retry()}
              </Button>
            )}

          {workspaceId && isPageInTrash && (
            <Button variant="default" size="sm" asChild className="gap-1.5">
              <Link
                to="/app/workspaces/$workspaceId/trash"
                params={{ workspaceId }}
              >
                <Trash2 className="size-3.5" />
                {m.error_action_check_trash()}
              </Link>
            </Button>
          )}

          {workspaceId && (
            <Button
              variant={
                reset && !isPageNotFound && !isPageInTrash
                  ? 'outline'
                  : 'default'
              }
              size="sm"
              asChild
              className="gap-1.5"
            >
              <Link to="/app/workspaces/$workspaceId" params={{ workspaceId }}>
                {m.error_action_back_to_workspace()}
              </Link>
            </Button>
          )}

          {!workspaceId && (
            <Button
              variant={reset ? 'outline' : 'default'}
              size="sm"
              asChild
              className="gap-1.5"
            >
              <Link to="/app/workspaces">
                {m.error_action_view_workspaces()}
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="sm" asChild className="gap-1.5">
            <Link to="/">
              <Home className="size-3.5" />
              {m.error_action_go_home()}
            </Link>
          </Button>
        </div>

        {/* Technical Error Details Toggle */}
        {errorMessage && (
          <div className="mt-4 w-full text-left">
            <button
              type="button"
              onClick={() => setShowDetails((prev) => !prev)}
              className="mx-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{m.error_details_label()}</span>
              {showDetails ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>

            {showDetails && (
              <div className="mt-2 max-h-48 overflow-auto rounded-lg border bg-muted/40 p-3 text-left font-mono text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">{errorMessage}</p>
                {errorStack && (
                  <pre className="mt-2 whitespace-pre-wrap break-all text-[11px] opacity-80">
                    {errorStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
