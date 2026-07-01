import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { workspaceMembersQueryOptions } from "../query-options";
import { useInviteMember } from "../hooks/use-invite-member";
import { useUpdateMemberRole } from "../hooks/use-update-member-role";
import { useRemoveMember } from "../hooks/use-remove-member";
import { MembersPresenter } from "./members-presenter";
import { MembersLoading } from "./members-loading";
import { MembersError } from "./members-error";
import type { WorkspaceRole } from "../types";

interface MembersContainerProps {
  workspaceId: string;
  canManage: boolean;
  currentUserRole: WorkspaceRole;
}

export function MembersContainer({
  workspaceId,
  canManage,
  currentUserRole,
}: MembersContainerProps) {
  const query = useQuery(workspaceMembersQueryOptions(workspaceId));
  const inviteMember = useInviteMember();
  const updateMemberRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  if (query.isPending) {
    return <MembersLoading />;
  }

  if (query.isError) {
    return (
      <MembersError message={query.error.message} onRetry={() => query.refetch()} />
    );
  }

  function handleInvite(email: string, role: WorkspaceRole) {
    inviteMember.mutate(
      { workspaceId, email, role, actingUserRole: currentUserRole },
      {
        onSuccess: () => toast.success(`Invitation sent to ${email}`),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleChangeRole(memberId: string, role: WorkspaceRole) {
    updateMemberRole.mutate(
      { workspaceId, memberId, role, actingUserRole: currentUserRole },
      {
        onSuccess: () => toast.success("Role updated"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function handleRemove(memberId: string) {
    removeMember.mutate(
      { workspaceId, memberId, actingUserRole: currentUserRole },
      {
        onSuccess: () => toast.success("Member removed"),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <MembersPresenter
      members={query.data}
      canManage={canManage}
      onInvite={handleInvite}
      isInviting={inviteMember.isPending}
      inviteErrorMessage={
        inviteMember.isError ? inviteMember.error.message : undefined
      }
      onChangeRole={handleChangeRole}
      onRemove={handleRemove}
    />
  );
}
