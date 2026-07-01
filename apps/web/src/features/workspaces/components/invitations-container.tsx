import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { pendingInvitationsQueryOptions } from "../query-options";
import { useAcceptInvitation } from "../hooks/use-accept-invitation";
import { useDeclineInvitation } from "../hooks/use-decline-invitation";
import { InvitationsListPresenter } from "./invitations-list-presenter";
import { InvitationsLoading } from "./invitations-loading";
import { InvitationsError } from "./invitations-error";
import { InvitationsEmpty } from "./invitations-empty";

export function InvitationsContainer() {
  const query = useQuery(pendingInvitationsQueryOptions());
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();
  const [respondingId, setRespondingId] = useState<string | undefined>();

  if (query.isPending) {
    return <InvitationsLoading />;
  }

  if (query.isError) {
    return (
      <InvitationsError
        message={query.error.message}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (query.data.length === 0) {
    return <InvitationsEmpty />;
  }

  function handleAccept(invitationId: string) {
    setRespondingId(invitationId);
    acceptInvitation.mutate(
      { invitationId },
      {
        onSuccess: (workspace) => {
          toast.success(`Joined ${workspace.name}`);
          setRespondingId(undefined);
        },
        onError: (error) => {
          toast.error(error.message);
          setRespondingId(undefined);
        },
      },
    );
  }

  function handleDecline(invitationId: string) {
    setRespondingId(invitationId);
    declineInvitation.mutate(
      { invitationId },
      {
        onSuccess: () => {
          toast("Invitation declined");
          setRespondingId(undefined);
        },
        onError: (error) => {
          toast.error(error.message);
          setRespondingId(undefined);
        },
      },
    );
  }

  return (
    <InvitationsListPresenter
      invitations={query.data}
      onAccept={handleAccept}
      onDecline={handleDecline}
      respondingInvitationId={respondingId}
    />
  );
}
