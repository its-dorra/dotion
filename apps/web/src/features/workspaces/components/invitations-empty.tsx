import { Mail } from "lucide-react";

export function InvitationsEmpty() {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Mail className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No pending invitations</p>
      <p className="max-w-xs text-sm text-muted-foreground">
        Workspace invites you receive will show up here.
      </p>
    </div>
  );
}
