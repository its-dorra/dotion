import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { workspacesListQueryOptions } from "../query-options";
import { useCreateWorkspace } from "../hooks/use-create-workspace";
import { WorkspaceSwitcherPresenter } from "./workspace-switcher-presenter";
import { WorkspaceSwitcherLoading } from "./workspace-switcher-loading";
import { WorkspaceSwitcherError } from "./workspace-switcher-error";
import { WorkspaceSwitcherEmpty } from "./workspace-switcher-empty";
import { CreateWorkspaceModal } from "./create-workspace-modal";

interface WorkspaceSwitcherContainerProps {
  /**
   * Optional: when the active route has no workspaceId param (e.g.
   * /app/notifications), the switcher falls back to the user's first
   * workspace so it still has something to display.
   */
  currentWorkspaceId?: string;
  /** Called once the switcher knows which workspace is actually showing. */
  onResolveWorkspace?: (workspaceId: string) => void;
}

export function WorkspaceSwitcherContainer({
  currentWorkspaceId,
  onResolveWorkspace,
}: WorkspaceSwitcherContainerProps) {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const query = useQuery(workspacesListQueryOptions());
  const createWorkspace = useCreateWorkspace();

  const workspaces = query.data;

  const currentWorkspace =
    workspaces?.find((w) => w.id === currentWorkspaceId) ?? workspaces?.[0];

  useEffect(() => {
    currentWorkspace?.id && onResolveWorkspace?.(currentWorkspace.id);
  }, [currentWorkspace?.id, onResolveWorkspace]);

  function handleSelectWorkspace(workspaceId: string) {
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
          navigate({
            to: "/app/workspaces/$workspaceId/pages/$pageId",
            params: { workspaceId: workspace.id, pageId: "root" },
          });
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  if (query.isPending) {
    return <WorkspaceSwitcherLoading />;
  }

  if (query.isError) {
    return (
      <WorkspaceSwitcherError
        message="Couldn't load workspaces."
        onRetry={() => query.refetch()}
      />
    );
  }

  if (workspaces?.length === 0) {
    return (
      <>
        <WorkspaceSwitcherEmpty
          onCreateWorkspace={() => setCreateDialogOpen(true)}
        />
        <CreateWorkspaceModal
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSubmit={(name) =>
            createWorkspace.mutate(
              { name },
              {
                onSuccess: (workspace) => {
                  toast.success(`${workspace.name} created`);
                  setCreateDialogOpen(false);
                  navigate({
                    to: "/app/workspaces/$workspaceId/pages/$pageId",
                    params: { workspaceId: workspace.id, pageId: "root" },
                  });
                },
                onError: (error) => toast.error(error.message),
              },
            )
          }
          isSubmitting={createWorkspace.isPending}
          errorMessage={
            createWorkspace.isError ? createWorkspace.error.message : undefined
          }
        />
      </>
    );
  }

  return (
    <>
      <WorkspaceSwitcherPresenter
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onSelectWorkspace={handleSelectWorkspace}
        onCreateWorkspace={() => setCreateDialogOpen(true)}
      />
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
