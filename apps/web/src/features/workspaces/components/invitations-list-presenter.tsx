import { InvitationCard } from "./invitation-card";
import { InfiniteScroll } from "@/components/ui/infinite-scroll";
import type { WorkspaceInvitation } from "../types";

interface InvitationsListPresenterProps {
  invitations: WorkspaceInvitation[];
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
  respondingInvitationId?: string;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

export function InvitationsListPresenter({
  invitations,
  onAccept,
  onDecline,
  respondingInvitationId,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
}: InvitationsListPresenterProps) {
  return (
    <div className="space-y-2">
      {invitations.map((invitation) => (
        <InvitationCard
          key={invitation.id}
          invitation={invitation}
          onAccept={onAccept}
          onDecline={onDecline}
          isResponding={respondingInvitationId === invitation.id}
        />
      ))}

      <InfiniteScroll
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        loadingText="Loading more invitations…"
        loadMoreText="Load more invitations"
      />
    </div>
  );
}
