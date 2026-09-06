import { Link, useParams } from '@tanstack/react-router'
import { FolderX, LayoutGrid, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as m from '@/paraglide/messages'

export interface TrashNotFoundProps {
  workspaceId?: string
}

export function TrashNotFound(
  props?: TrashNotFoundProps | Record<string, unknown>,
) {
  const params = useParams({ strict: false }) as { workspaceId?: string }
  const workspaceId =
    props &&
    typeof props === 'object' &&
    'workspaceId' in props &&
    typeof props.workspaceId === 'string'
      ? props.workspaceId
      : params?.workspaceId

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-1 ring-border/50">
        <FolderX className="h-7 w-7" />
      </div>

      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
        {m.workspace_not_found_title()}
      </h2>

      <p className="max-w-md text-sm text-muted-foreground">
        {m.workspace_not_found_description()}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {workspaceId ? (
          <Button asChild variant="default" size="sm">
            <Link to="/app/workspaces/$workspaceId" params={{ workspaceId }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {m.error_action_back_to_workspace()}
            </Link>
          </Button>
        ) : (
          <Button asChild variant="default" size="sm">
            <Link to="/app/workspaces">
              <LayoutGrid className="mr-2 h-4 w-4" />
              {m.error_action_view_workspaces()}
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
