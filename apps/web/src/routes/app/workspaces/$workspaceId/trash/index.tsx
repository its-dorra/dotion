import { createFileRoute } from "@tanstack/react-router";
import { TrashContainer } from "@/features/pages";

export const Route = createFileRoute("/app/workspaces/$workspaceId/trash/")({
  component: TrashPage,
});

function TrashPage() {
  const { workspaceId } = Route.useParams();

  return (
    <div className="h-full overflow-y-auto">
      <TrashContainer workspaceId={workspaceId} />
    </div>
  );
}
