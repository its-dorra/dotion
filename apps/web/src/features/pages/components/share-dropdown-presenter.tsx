import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { PagePermissionRow } from './page-permission-row'
import type { Page, PageMemberPermission } from '../types'
import { m } from '@/paraglide/messages'

interface ShareDropdownPresenterProps {
  page: Page
  permissions: PageMemberPermission[]
  permissionsSlot?: React.ReactNode
  canManage: boolean
}

export function ShareDropdownPresenter({
  page,
  permissions,
  permissionsSlot,
  canManage,
}: ShareDropdownPresenterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Share2 className="h-4 w-4" />
          {m.page_share()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-3">
        <p className="px-0.5 py-1 text-xs font-medium text-muted-foreground">
          {m.page_share_who_has_access()}
        </p>
        {permissionsSlot ?? (
          <div className="divide-y">
            {permissions.map((permission) => (
              <PagePermissionRow
                key={permission.userId}
                workspaceId={page.workspaceId}
                pageId={page.id}
                permission={permission}
                canManage={canManage}
              />
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
