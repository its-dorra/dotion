import { useQuery } from '@tanstack/react-query'
import { Clock, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { pageAccessRequestStatusQueryOptions } from '../query-options'
import { useRequestPageAccess } from '../hooks/use-request-page-access'
import * as m from '@/paraglide/messages'
import type { PageId } from '@dotion/shared/pages/types'
import type { WorkspaceId } from '@/features/workspaces/types'

interface RequestAccessButtonProps {
  workspaceId: WorkspaceId
  pageId: PageId
  currentRole?: 'viewer' | 'commenter'
}

export function RequestAccessButton({
  workspaceId,
  pageId,
  currentRole = 'viewer',
}: RequestAccessButtonProps) {
  const { data: statusData } = useQuery(
    pageAccessRequestStatusQueryOptions(workspaceId, pageId),
  )
  const requestAccess = useRequestPageAccess()

  const hasPending = statusData?.hasPendingRequest
  const requestedRole = statusData?.request?.requestedRole ?? 'editor'

  if (hasPending) {
    const roleLabel =
      requestedRole === 'commenter'
        ? m.page_role_commenter()
        : m.page_role_editor()

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className="gap-1.5 border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 select-none dark:text-amber-400"
            >
              <Clock className="h-3.5 w-3.5 animate-pulse" />
              {m.page_access_request_pending({ role: roleLabel })}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{m.page_access_request_pending_tooltip()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  async function handleRequest(role: 'editor' | 'commenter') {
    await requestAccess.mutateAsync({
      workspaceId,
      pageId,
      requestedRole: role,
    })
  }

  if (currentRole === 'commenter') {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={requestAccess.isPending}
        className="h-8 gap-1.5 text-xs"
        onClick={() => handleRequest('editor')}
      >
        <KeyRound className="h-3.5 w-3.5" />
        {requestAccess.isPending
          ? m.page_request_access_submitting()
          : m.page_request_edit_access()}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={requestAccess.isPending}
          className="h-8 gap-1.5 text-xs"
        >
          <KeyRound className="h-3.5 w-3.5" />
          {requestAccess.isPending
            ? m.page_request_access_submitting()
            : m.page_request_edit_access()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleRequest('editor')}>
          {m.page_request_edit_access()}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleRequest('commenter')}>
          {m.page_request_comment_access()}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
