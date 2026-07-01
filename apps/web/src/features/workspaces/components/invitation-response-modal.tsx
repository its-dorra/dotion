import { useIsMobile } from "@/lib/use-is-mobile";
import { InvitationDialog } from "./invitation-dialog";
import { InvitationDrawer } from "./invitation-drawer";
import type { WorkspaceInvitation } from "../types";

interface InvitationResponseModalProps {
  invitation: WorkspaceInvitation;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
  isResponding: boolean;
}

export function InvitationResponseModal(props: InvitationResponseModalProps) {
  const isMobile = useIsMobile();
  return isMobile ? (
    <InvitationDrawer {...props} />
  ) : (
    <InvitationDialog {...props} />
  );
}
