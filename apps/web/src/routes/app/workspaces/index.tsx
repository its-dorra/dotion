import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceSelectionContainer } from "@/features/workspaces";

export const Route = createFileRoute("/app/workspaces/")({
  component: WorkspaceSelectionPage,
});

function WorkspaceSelectionPage() {
  return (
    <div className="h-full overflow-y-auto">
      <WorkspaceSelectionContainer />
    </div>
  );
}
