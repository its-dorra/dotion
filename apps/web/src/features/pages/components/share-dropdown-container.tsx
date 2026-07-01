import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { pagePermissionsQueryOptions } from "../query-options";
import { useInviteToPage } from "../hooks/use-invite-to-page";
import { useUpdatePagePermission } from "../hooks/use-update-page-permission";
import { useSetPagePublic } from "../hooks/use-set-page-public";
import { ShareDropdownPresenter } from "./share-dropdown-presenter";
import { SharePermissionsLoading } from "./share-permissions-loading";
import { SharePermissionsError } from "./share-permissions-error";
import { PagePermissionRow } from "./page-permission-row";
import type { Page, PagePermissionRole } from "../types";

interface ShareDropdownContainerProps {
  page: Page;
}

export function ShareDropdownContainer({ page }: ShareDropdownContainerProps) {
  const query = useQuery(pagePermissionsQueryOptions(page.id));
  const inviteToPage = useInviteToPage();
  const updatePermission = useUpdatePagePermission();
  const setPagePublic = useSetPagePublic();

  const canManage = page.currentUserRole === "editor";

  function handleInvite(email: string, role: PagePermissionRole) {
    inviteToPage.mutate(
      { pageId: page.id, email, role, actingUserRole: page.currentUserRole },
      {
        onSuccess: () => toast.success(`${email} now has access`),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleChangeRole(userId: string, role: PagePermissionRole) {
    updatePermission.mutate(
      { pageId: page.id, userId, role, actingUserRole: page.currentUserRole },
      {
        onSuccess: () => toast.success("Permission updated"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleTogglePublic(isPublic: boolean) {
    setPagePublic.mutate(
      { pageId: page.id, isPublic },
      {
        onSuccess: () =>
          toast(isPublic ? "Page is now public" : "Page is now private"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  const permissionsSlot = query.isPending ? (
    <SharePermissionsLoading />
  ) : query.isError ? (
    <SharePermissionsError
      message={query.error.message}
      onRetry={() => query.refetch()}
    />
  ) : (
    <div className="divide-y">
      {query.data.map((permission) => (
        <PagePermissionRow
          key={permission.userId}
          permission={permission}
          canManage={canManage}
          onChangeRole={handleChangeRole}
        />
      ))}
    </div>
  );

  return (
    <ShareDropdownPresenter
      page={page}
      permissions={query.data ?? []}
      permissionsSlot={permissionsSlot}
      canManage={canManage}
      onInvite={handleInvite}
      isInviting={inviteToPage.isPending}
      inviteErrorMessage={
        inviteToPage.isError ? inviteToPage.error.message : undefined
      }
      onChangeRole={handleChangeRole}
      onTogglePublic={handleTogglePublic}
      isUpdatingPublic={setPagePublic.isPending}
    />
  );
}
