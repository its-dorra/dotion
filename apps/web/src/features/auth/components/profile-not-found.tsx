import { Link } from '@tanstack/react-router'
import { UserX, LayoutGrid, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as m from '@/paraglide/messages'

export function ProfileNotFound() {
  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-1 ring-border/50">
        <UserX className="h-7 w-7" />
      </div>

      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
        {m.not_found_generic_title()}
      </h2>

      <p className="max-w-md text-sm text-muted-foreground">
        {m.not_found_generic_description()}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link to="/app/workspaces">
            <LayoutGrid className="mr-2 h-4 w-4" />
            {m.error_action_view_workspaces()}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            {m.error_action_go_home()}
          </Link>
        </Button>
      </div>
    </div>
  )
}
