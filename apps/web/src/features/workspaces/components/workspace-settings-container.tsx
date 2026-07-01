import { useQuery } from "@tanstack/react-query";
import { workspaceDetailQueryOptions } from "../query-options";
import { WorkspaceSettingsPresenter } from "./workspace-settings-presenter";
import { GeneralSettingsLoading } from "./general-settings-loading";
import { GeneralSettingsError } from "./general-settings-error";

interface WorkspaceSettingsContainerProps {
  workspaceId: string;
}

export function WorkspaceSettingsContainer({
  workspaceId,
}: WorkspaceSettingsContainerProps) {
  // Only used to resolve the current user's role for permission gating.
  // The General and Members tabs each own their own data fetching.
  const query = useQuery(workspaceDetailQueryOptions(workspaceId));

  if (query.isPending) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <GeneralSettingsLoading />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <GeneralSettingsError
          message={query.error.message}
          onRetry={() => query.refetch()}
        />
      </div>
    );
  }

  const currentUserRole = query.data.currentUserRole;
  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <WorkspaceSettingsPresenter
      workspaceId={workspaceId}
      canManage={canManage}
      currentUserRole={currentUserRole}
    />
  );
}
