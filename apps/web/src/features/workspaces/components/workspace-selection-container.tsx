import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { workspacesListQueryOptions } from "../query-options";
import { useCreateWorkspace } from "../hooks/use-create-workspace";
import { WorkspaceSelectionPresenter } from "./workspace-selection-presenter";
import { WorkspaceSelectionLoading } from "./workspace-selection-loading";
import { WorkspaceSelectionError } from "./workspace-selection-error";
import { WorkspaceSelectionEmpty } from "./workspace-selection-empty";
import { CreateWorkspaceModal } from "./create-workspace-modal";

export function WorkspaceSelectionContainer() {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const query = useQuery(workspacesListQueryOptions());
  const createWorkspace = useCreateWorkspace();

  function navigateToWorkspace(workspaceId: string) {
    navigate({
      to: "/app/workspaces/$workspaceId/pages/$pageId",
      params: { workspaceId, pageId: "root" },
    });
  }

  function handleCreateWorkspace(name: string) {
    createWorkspace.mutate(
      { name },
      {
        onSuccess: (workspace) => {
          toast.success(`${workspace.name} created`);
          setCreateDialogOpen(false);
          navigateToWorkspace(workspace.id);
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  if (query.isPending) {
    return <WorkspaceSelectionLoading />;
  }

  if (query.isError) {
    return (
      <WorkspaceSelectionError
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  const workspaces = query.data;

  return (
    <>
      {workspaces.length === 0 ? (
        <WorkspaceSelectionEmpty
          onCreateWorkspace={() => setCreateDialogOpen(true)}
        />
      ) : (
        <WorkspaceSelectionPresenter
          workspaces={workspaces}
          onSelectWorkspace={navigateToWorkspace}
          onCreateWorkspace={() => setCreateDialogOpen(true)}
        />
      )}
      <CreateWorkspaceModal
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateWorkspace}
        isSubmitting={createWorkspace.isPending}
        errorMessage={
          createWorkspace.isError ? createWorkspace.error.message : undefined
        }
      />
    </>
  );
}
