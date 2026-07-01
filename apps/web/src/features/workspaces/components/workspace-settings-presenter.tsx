import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { GeneralSettingsContainer } from "./general-settings-container";
import { MembersContainer } from "./members-container";
import type { WorkspaceRole } from "../types";

interface WorkspaceSettingsPresenterProps {
  workspaceId: string;
  canManage: boolean;
  currentUserRole: WorkspaceRole;
}

export function WorkspaceSettingsPresenter({
  workspaceId,
  canManage,
  currentUserRole,
}: WorkspaceSettingsPresenterProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        Workspace settings
      </h1>
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <GeneralSettingsContainer workspaceId={workspaceId} />
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
  );
}
