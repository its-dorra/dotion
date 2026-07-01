import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { workspaceDetailQueryOptions } from "../query-options";
import { useUpdateWorkspace } from "../hooks/use-update-workspace";
import { GeneralSettingsForm } from "./general-settings-form";
import { GeneralSettingsLoading } from "./general-settings-loading";
import { GeneralSettingsError } from "./general-settings-error";

interface GeneralSettingsContainerProps {
  workspaceId: string;
}

export function GeneralSettingsContainer({
  workspaceId,
}: GeneralSettingsContainerProps) {
  const query = useQuery(workspaceDetailQueryOptions(workspaceId));
  const updateWorkspace = useUpdateWorkspace();

  if (query.isPending) {
    return <GeneralSettingsLoading />;
  }

  if (query.isError) {
    return (
      <GeneralSettingsError
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  const workspace = query.data;
  const canManage =
    workspace.currentUserRole === "owner" ||
    workspace.currentUserRole === "admin";

  function handleSave(name: string) {
    updateWorkspace.mutate(
      { workspaceId, name },
      {
        onSuccess: () => toast.success("Workspace updated"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <GeneralSettingsForm
      workspace={workspace}
      canManage={canManage}
      onSave={handleSave}
      isSaving={updateWorkspace.isPending}
      errorMessage={
        updateWorkspace.isError ? updateWorkspace.error.message : undefined
      }
    />
  );
}
