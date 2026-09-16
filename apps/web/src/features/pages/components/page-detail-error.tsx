import * as React from 'react'
import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import {
  FileX,
  Lock,
  Trash2,
  RefreshCw,
  LayoutGrid,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'
import {
  PageNotFoundError,
  PageAlreadyInTrashError,
  InsufficientPagePermissionError,
} from '@/features/pages/errors'
import {
  AuthorizationError,
  InsufficientPermissionError,
} from '@/features/authorization/errors'
import { AuthenticationError, NotFoundError } from '@/lib/errors'

export interface PageDetailErrorProps extends Partial<ErrorComponentProps> {
  message?: string
  workspaceId?: string
  pageId?: string
  onRetry?: () => void
}

export function PageDetailError({
  error,
  reset,
  message,
  workspaceId,
  onRetry,
}: PageDetailErrorProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  const handleRetry = () => {
    if (reset) reset()
    else if (onRetry) onRetry()
    else window.location.reload()
  }

  const isPageNotFound = PageNotFoundError.is(error) || NotFoundError.is(error)
  const isPageInTrash = PageAlreadyInTrashError.is(error)
  const isPermissionDenied =
    InsufficientPagePermissionError.is(error) ||
    InsufficientPermissionError.is(error) ||
    AuthorizationError.is(error)
  const isAuthError = AuthenticationError.is(error)

  const title = isPageNotFound
    ? m.page_not_found_title()
    : isPageInTrash
      ? m.error_page_in_trash_title()
      : isPermissionDenied
        ? m.error_access_denied_title()
        : m.error_generic_title()

  const description =
    message ||
    (isPageNotFound
      ? m.page_not_found_description()
      : isPageInTrash
        ? m.error_page_in_trash_description()
        : isPermissionDenied
          ? m.error_access_denied_description()
          : error instanceof Error
            ? error.message
            : m.error_generic_description())

  const Icon = isPageNotFound
    ? FileX
    : isPageInTrash
      ? Trash2
      : isPermissionDenied || isAuthError
        ? Lock
        : FileX

  const detailedMessage =
    error instanceof Error
      ? error.stack || error.message
      : typeof error === 'string'
        ? error
        : null

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-1 ring-border/50">
        <Icon className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {!isPageNotFound && !isPermissionDenied && (
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {m.error_action_retry()}
          </Button>
        )}

        {isPageInTrash && workspaceId && (
          <Button asChild variant="default">
            <Link
              to="/app/workspaces/$workspaceId/trash"
              params={{ workspaceId }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {m.error_action_check_trash()}
            </Link>
          </Button>
        )}

        {workspaceId ? (
          <Button asChild variant="outline">
            <Link to="/app/workspaces/$workspaceId" params={{ workspaceId }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {m.error_action_back_to_workspace()}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/app/workspaces">
              <LayoutGrid className="mr-2 h-4 w-4" />
              {m.error_action_view_workspaces()}
            </Link>
          </Button>
        )}
      </div>

      {detailedMessage && (
        <div className="mt-8 max-w-lg text-left">
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {showDetails ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            <span>{m.error_details_label()}</span>
          </button>

          {showDetails && (
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <code>{detailedMessage}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  )
}
