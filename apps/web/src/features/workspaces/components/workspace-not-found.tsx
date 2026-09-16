import { Link } from '@tanstack/react-router'
import { FolderX, LayoutGrid, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'

export interface WorkspaceNotFoundProps {
  workspaceId?: string
}

export function WorkspaceNotFound(
  _props?: WorkspaceNotFoundProps | Record<string, unknown>,
) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-1 ring-border/50">
        <FolderX className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
        {m.workspace_not_found_title()}
      </h2>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {m.workspace_not_found_description()}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="default" size="sm">
          <Link to="/app/workspaces">
            <LayoutGrid className="mr-2 h-4 w-4" />
            {m.error_action_view_workspaces()}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            {m.error_action_go_home()}
          </Link>
        </Button>
      </div>
    </div>
  )
}
