import { InviteMemberForm } from "./invite-member-form";
import { MemberRow } from "./member-row";
import { MembersEmpty } from "./members-empty";
import type { WorkspaceMember, WorkspaceRole } from "../types";

interface MembersPresenterProps {
  members: WorkspaceMember[];
  canManage: boolean;
  onInvite: (email: string, role: WorkspaceRole) => void;
  isInviting: boolean;
  inviteErrorMessage?: string;
  onChangeRole: (memberId: string, role: WorkspaceRole) => void;
  onRemove: (memberId: string) => void;
}

export function MembersPresenter({
  members,
  canManage,
  onInvite,
  isInviting,
  inviteErrorMessage,
  onChangeRole,
  onRemove,
}: MembersPresenterProps) {
  const otherMembers = members.filter((m) => m.role !== "owner");
  const owner = members.find((m) => m.role === "owner");

  return (
    <div className="space-y-4">
      {canManage ? (
        <InviteMemberForm
          onInvite={onInvite}
          isSubmitting={isInviting}
          errorMessage={inviteErrorMessage}
        />
      ) : null}

      <div className="divide-y">
        {owner ? (
          <MemberRow
            member={owner}
            canManage={canManage}
            onChangeRole={onChangeRole}
            onRemove={onRemove}
          />
        ) : null}
        {otherMembers.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            canManage={canManage}
            onChangeRole={onChangeRole}
            onRemove={onRemove}
          />
        ))}
      </div>

      {otherMembers.length === 0 ? <MembersEmpty /> : null}
    </div>
  );
}
