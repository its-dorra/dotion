import { Link } from '@tanstack/react-router'
import { FolderX, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as m from '@/paraglide/messages'

export function WorkspaceSelectionNotFound() {
  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-1 ring-border/50">
        <FolderX className="h-7 w-7" />
      </div>

      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
        {m.workspace_not_found_title()}
      </h2>

      <p className="max-w-md text-sm text-muted-foreground">
        {m.workspace_not_found_description()}
      </p>

      <div className="mt-4 flex gap-3">
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            {m.error_action_go_home()}
          </Link>
        </Button>
      </div>
    </div>
  )
}
