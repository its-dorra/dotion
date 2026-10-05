import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useSuspenseQueries } from '@tanstack/react-query'
import { Plus, FileText, Settings, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useSession } from '@/features/auth/hooks/use-session'
import { useCreatePage } from '@/features/pages/hooks/use-create-page'
import { PageTreeItem } from '@/features/pages/components/page-tree-item'
import { buildPageTree } from '@/features/pages/lib/build-page-tree'
import { InviteMemberModal } from './invite-member-modal'
import { WorkspaceIcon } from './workspace-icon'
import { Can } from '@/features/authorization/components/can'
import { workspaceDetailQueryOptions } from '../query-options'
import { pageTreeQueryOptions } from '@/features/pages/query-options'
import { m } from '@/paraglide/messages'
import type { WorkspaceId } from '@dotion/shared/workspaces/types'
import type { PageTreeNode } from '@dotion/shared/pages/types'

interface WorkspaceDashboardProps {
  workspaceId: WorkspaceId
}

interface DashboardPageTreeProps {
  pages: PageTreeNode[]
  workspaceId: WorkspaceId
}

function DashboardPageTree({ pages, workspaceId }: DashboardPageTreeProps) {
  const tree = useMemo(() => buildPageTree(pages), [pages])

  return (
    <div className="rounded-lg border bg-card p-2">
      <div className="space-y-0.5">
        {tree.map((node) => (
          <PageTreeItem
            key={node.id}
            node={node}
            workspaceId={workspaceId}
            depth={0}
          />
        ))}
      </div>
    </div>
  )
}

function getGreeting(name: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return m.workspace_greeting_morning({ name })
  if (hour < 18) return m.workspace_greeting_afternoon({ name })
  return m.workspace_greeting_evening({ name })
}

export function WorkspaceDashboard({ workspaceId }: WorkspaceDashboardProps) {
  const { data: session } = useSession()
  const [{ data: workspace }, { data: pageTree }] = useSuspenseQueries({
    queries: [
      workspaceDetailQueryOptions(workspaceId),
      pageTreeQueryOptions(workspaceId),
    ],
  })

  const createPage = useCreatePage()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const userName =
    session?.user?.name?.split(' ')[0] ||
    session?.user?.email?.split('@')[0] ||
    ''
  const greetingText = getGreeting(userName)

  async function handleCreatePage() {
    await createPage.mutateAsync({
      workspaceId,
      title: m.page_untitled(),
    })
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center gap-2 md:hidden">
        <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <WorkspaceIcon name={workspace.name} size="lg" />
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              suppressHydrationWarning
            >
              {greetingText}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {workspace.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Can
            permission="workspace:inviteMember"
            target={{ workspaceId }}
            workspaceId={workspaceId}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsInviteModalOpen(true)}
              className="gap-1.5"
            >
              <UserPlus className="h-4 w-4" />
              {m.page_share_invite()}
            </Button>
          </Can>

          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link
              to="/app/workspaces/$workspaceId/settings"
              params={{ workspaceId }}
            >
              <Settings className="h-4 w-4" />
              {m.sidebar_settings()}
            </Link>
          </Button>

          <Can permission="page:create" container={{ workspaceId }}>
            <Button
              size="sm"
              onClick={handleCreatePage}
              disabled={createPage.isPending}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              {m.workspace_action_new_page()}
            </Button>
          </Can>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {m.workspace_pages_heading()}
          </h2>
          {pageTree.length > 0 && (
            <Can permission="page:create" container={{ workspaceId }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreatePage}
                disabled={createPage.isPending}
                className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                {m.page_tree_add_page()}
              </Button>
            </Can>
          )}
        </div>

        {pageTree.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-base font-medium text-foreground">
              {m.page_tree_empty_title()}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {m.page_tree_empty_desc()}
            </p>
            <Can permission="page:create" container={{ workspaceId }}>
              <Button
                size="sm"
                onClick={handleCreatePage}
                disabled={createPage.isPending}
                className="mt-4 gap-1.5"
              >
                <Plus className="h-4 w-4" />
                {m.page_tree_create_first()}
              </Button>
            </Can>
          </div>
        ) : (
          <DashboardPageTree pages={pageTree} workspaceId={workspaceId} />
        )}
      </div>

      <InviteMemberModal
        workspaceId={workspaceId}
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
      />
    </div>
  )
}
