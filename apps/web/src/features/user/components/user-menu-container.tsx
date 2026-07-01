import { useQuery } from "@tanstack/react-query";
import { currentUserQueryOptions } from "../query-options";
import { UserMenuPresenter } from "./user-menu-presenter";
import { UserMenuLoading } from "./user-menu-loading";

interface UserMenuContainerProps {
  currentWorkspaceId?: string;
}

export function UserMenuContainer({
  currentWorkspaceId,
}: UserMenuContainerProps) {
  const query = useQuery(currentUserQueryOptions());

  if (query.isPending) {
    return <UserMenuLoading />;
  }

  if (query.isError) {
    // Non-critical UI; fail silently rather than blocking the sidebar.
    return null;
  }

  function handleLogout() {
    // Authentication is out of scope for this build. Wire this to the real
    // sign-out flow once auth routes exist.
  }

  return (
    <UserMenuPresenter
      user={query.data}
      currentWorkspaceId={currentWorkspaceId}
      onLogout={handleLogout}
    />
  );
}
