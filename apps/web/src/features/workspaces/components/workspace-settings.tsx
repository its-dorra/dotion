import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { workspaceDetailQueryOptions } from '../query-options'
import { canQueryOptions } from '@/features/authorization/query-options'
import { GeneralSettings } from './general-settings'
import { MembersContainer } from './members-container'
import { m } from '@/paraglide/messages'
import type { WorkspaceId, WorkspaceRole } from '../types'

interface WorkspaceSettingsProps {
  workspaceId: WorkspaceId
}

export function WorkspaceSettings({ workspaceId }: WorkspaceSettingsProps) {
  const { data: _workspace } = useSuspenseQuery(
    workspaceDetailQueryOptions(workspaceId),
  )

  const { data: managePerm } = useQuery(
    canQueryOptions({
      resource: { type: 'workspace', id: { workspaceId } },
      action: 'manageSettings',
    }),
  )

  const canManage = managePerm?.allowed ?? false
  const currentUserRole: WorkspaceRole = canManage ? 'owner' : 'member'

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <SidebarTrigger className="h-7 w-7 text-muted-foreground hover:text-foreground md:hidden" />
        <h1 className="text-2xl font-semibold tracking-tight">
          {m.workspace_settings_title()}
        </h1>
      </div>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">{m.workspace_general()}</TabsTrigger>
          <TabsTrigger value="members">{m.workspace_members()}</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <GeneralSettings workspaceId={workspaceId} />
        </TabsContent>
        <TabsContent value="members" className="mt-6">
          <MembersContainer
            workspaceId={workspaceId}
            canManage={canManage}
            currentUserRole={currentUserRole}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
