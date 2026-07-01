import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceSettingsContainer } from "@/features/workspaces";

export const Route = createFileRoute("/app/workspaces/$workspaceId/settings/")({
  component: WorkspaceSettingsPage,
});

function WorkspaceSettingsPage() {
  const { workspaceId } = Route.useParams();

  return (
    <div className="h-full overflow-y-auto">
      <WorkspaceSettingsContainer workspaceId={workspaceId} />
    </div>
  );
}
