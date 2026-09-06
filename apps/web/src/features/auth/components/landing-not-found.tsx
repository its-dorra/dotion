import { Link, type NotFoundRouteProps } from '@tanstack/react-router'
import { Home, FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'
import * as m from '@/paraglide/messages'

export function LandingNotFound(_props: Partial<NotFoundRouteProps> = {}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground ring-1 ring-border/50">
        <FileQuestion className="h-7 w-7" />
      </div>

      <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
        {m.not_found_generic_title()}
      </h2>

      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {m.not_found_generic_description()}
      </p>

      <div className="mt-6 flex gap-3">
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
